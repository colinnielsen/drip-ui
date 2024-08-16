import { Currency, Unsaved } from '@/data-model/_common/type/CommonType';
import {
  OrderRepository,
  UpdateOrderOperation,
} from '@/data-model/order/OrderRepository';
import {
  ExternalOrderInfo,
  Order,
  OrderItem,
  PaidOrder,
} from '@/data-model/order/OrderType';
import { UUID } from 'crypto';
import { sql } from '@vercel/postgres';
import { v4 } from 'uuid';
import {
  createExternalOrderInfo,
  isPending,
} from '@/data-model/order/OrderDTO';
import { Hash } from 'viem';
import { getTransactionReceipt } from 'viem/actions';
import { BASE_CLIENT } from '@/lib/ethereum';
import { err, sortDateAsc } from '@/lib/utils';
import { Shop } from '@/data-model/shop/ShopType';
import { sliceKit } from '@/lib/slice';
import { OrderStatus as SliceOrderStatus } from '@slicekit/core';
import { differenceInMinutes, parseISO } from 'date-fns';

export class SQLOrderRepository implements OrderRepository {
  async findById(id: UUID): Promise<Order | null> {
    const result = await sql`SELECT * FROM orders WHERE id = ${id}`;
    return result.rows[0] as Order | null;
  }

  async save(
    shopId: UUID,
    userId: UUID,
    items: Unsaved<OrderItem>[],
  ): Promise<Order> {
    const id = v4() as UUID;
    const orderItems = items.map(i => ({
      id: v4() as UUID,
      ...i,
    }));

    const order: Order = {
      id,
      shop: shopId,
      user: userId,
      status: '1-pending',
      timestamp: new Date().toISOString(),
      tip: null,
      orderItems,
    };

    await sql`
      INSERT INTO orders (id, shop, "user", status, timestamp, "orderItems")
      VALUES (${order.id}, ${order.shop}, ${order.user}, ${order.status}, ${order.timestamp}, ${JSON.stringify(order.orderItems)})
    `;

    return order;
  }

  async update(
    orderId: UUID,
    operations: UpdateOrderOperation[],
  ): Promise<Order | null> {
    const result = await sql`
      SELECT
      o.*,
      (
        SELECT json_agg(s.*)
        FROM shops s
        WHERE s.id = o.shop
        LIMIT 1
      ) AS relatedshop
      FROM orders o
      WHERE o.id = ${orderId}
    `;
    if (!result.rowCount) throw Error('Order not found');

    const { relatedshop, ...order } = result.rows[0] as Order & {
      relatedshop: Shop[];
    };
    const shop = relatedshop[0];

    if (order.status !== '1-pending')
      throw Error('Cannot update an order that is not pending');

    for (const op of operations) {
      let orderItemId: number;

      switch (op.__type) {
        case 'add':
          if (Array.isArray(op.orderItem))
            order.orderItems = [
              ...order.orderItems,
              ...op.orderItem.map<OrderItem>(o => ({ id: v4() as UUID, ...o })),
            ];
          else order.orderItems.push({ id: v4() as UUID, ...op.orderItem });
          break;
        case 'delete':
          orderItemId = order.orderItems.findIndex(
            o => o.id === op.orderItemId,
          );
          if (orderItemId === -1) throw Error('bad order id');
          order.orderItems.splice(orderItemId, 1);
          break;
        case 'update':
          orderItemId = order.orderItems.findIndex(
            o => o.id === op.orderItemId,
          );
          if (orderItemId === -1) throw Error('bad order id');
          order.orderItems[orderItemId] = op.orderItem;
          break;
        case 'tip':
          if (shop.tipConfig.enabled === false)
            throw Error('tipping is disabled');

          order.tip = op.tip
            ? {
                ...op.tip,
                address: shop.tipConfig.address,
              }
            : null;
          break;
        default:
          let _err: never;
          throw Error('bad impl');
      }
    }

    if (order.orderItems.length === 0) {
      await this.delete(orderId);
      return null;
    }

    await sql`
      UPDATE orders
      SET
      "orderItems" = ${JSON.stringify(order.orderItems)},
      "tip" = ${order.tip ? JSON.stringify(order.tip) : null}
      WHERE id = ${orderId}
    `;

    return order;
  }

  async pay(
    orderId: UUID,
    transactionHash: Hash,
    paidPrices: Record<UUID, Currency>,
  ): Promise<Order> {
    const order = await this.findById(orderId);
    if (!order) throw Error('Order not found');

    const nextOrder: Order = {
      ...order,
      transactionHash,
      status: '2-submitting',
      orderItems: order.orderItems.map<OrderItem>(o => ({
        ...o,
        paidPrice: paidPrices[o.id] || err('price not found'),
      })),
    };

    const result = await sql`UPDATE orders
      SET
      "transactionHash" = ${nextOrder.transactionHash},
      "status" = ${nextOrder.status},
      "orderItems" = ${JSON.stringify(nextOrder.orderItems)}
      WHERE id = ${orderId}
      RETURNING *
    `;
    const o = result.rows[0];
    return o as Order;
  }

  async addExternalOrderInfo(
    orderId: UUID,
    data: ExternalOrderInfo,
  ): Promise<Order> {
    const query = await sql`
      SELECT orders.*, shops."__sourceConfig"
      FROM orders
      JOIN shops ON orders.shop = shops.id
      WHERE orders.id = ${orderId}
    `;

    const order = query.rows[0] as Order & {
      __sourceConfig: Shop['__sourceConfig'];
    };

    if (!order || isPending(order)) throw Error('Order not found');

    const externalOrderInfo = createExternalOrderInfo(order.__sourceConfig, {
      ...order.externalOrderInfo,
      ...data,
    });

    const result = await sql`UPDATE orders
    SET
    "externalOrderInfo" = ${JSON.stringify(externalOrderInfo)}
    WHERE id = ${orderId}
    RETURNING *
    `;
    const o = result.rows[0];
    return o as Order;
  }

  async syncWithExternalService(orderIds: UUID[]): Promise<Order[]> {
    const result = await sql.query(
      `SELECT * FROM orders WHERE id IN (${orderIds.map(
        (_, i) => `$${i + 1}`,
      )})`,
      orderIds,
    );

    const orders = result.rows.filter(
      o => 'externalOrderInfo' in o && o.status === '3-in-progress',
    ) as PaidOrder[];
    if (!orders.length) return result.rows as Order[];

    const updatedOrders = await Promise.all(
      orders.map(async o => this.syncOrderWithExternalService(o)),
    );

    return updatedOrders;
  }

  private async syncOrderWithExternalService(
    order: PaidOrder,
  ): Promise<PaidOrder> {
    if (!order.externalOrderInfo) throw Error('externalOrderInfo not found');

    const itsBeen5Minutes = (timestamp: string) =>
      differenceInMinutes(new Date(), parseISO(timestamp)) > 5;

    if (order.externalOrderInfo.__type === 'slice') {
      const sliceOrders = await sliceKit
        .getOrder({
          transactionHash: order.transactionHash,
        })
        .then(o => o.order.slicerOrders)
        .catch(e => {
          throw Error(`Error fetching order from slice: ${e}`);
        });
      if (!sliceOrders.length) throw Error('slice order not found');
      const [sliceOrder] = sliceOrders;
      const orderNumber = sliceOrder.refOrderId;
      const status: SliceOrderStatus = sliceOrder.status;
      const newOrderStatus: Order['status'] =
        status === 'Completed' || itsBeen5Minutes(order.timestamp)
          ? '4-complete'
          : status === 'Canceled'
            ? 'cancelled'
            : order.status;

      const result = await sql`UPDATE
          orders
          SET "externalOrderInfo" = ${JSON.stringify({
            ...order.externalOrderInfo!,
            orderNumber,
            status: newOrderStatus,
          })},
        "status" = ${newOrderStatus}
        WHERE id = ${order.id}
        RETURNING *`;

      return result.rows[0] as PaidOrder;
    } else throw Error('order type not implemented');
  }

  async checkStatus(orderId: UUID): Promise<Order> {
    const result = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
    const [order] = result.rows as [Order];
    if (!order) throw Error('Order not found');

    if (order.status === '1-pending') return order;

    const txSettled = await getTransactionReceipt(BASE_CLIENT, {
      hash: order.transactionHash,
    })
      .then(t => t.status === 'success')
      .catch(() => false);

    if (txSettled) {
      const result =
        await sql`UPDATE orders SET status = '3-in-progress' WHERE id = ${orderId} RETURNING *`;

      return result.rows[0] as Order;
    } else return order;
  }

  async delete(id: UUID): Promise<void> {
    const result = await sql`DELETE FROM orders WHERE id = ${id}`;
    if (result.rowCount === 0) throw Error('could not delete');
  }

  async clear(orderId: UUID): Promise<Order> {
    const result = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
    const order = result.rows[0] as Order;
    if (!order) throw Error('Order not found');

    order.orderItems = [];
    await sql`
      UPDATE orders
      SET "orderItems" = ${JSON.stringify(order.orderItems)}
      WHERE id = ${orderId}
    `;

    return order;
  }

  async getOrdersByUserId(userId: UUID): Promise<Order[]> {
    const result = await sql`SELECT * FROM orders WHERE "user" = ${userId}`;
    return result.rows as Order[];
  }

  async getRecentUserOrder(userId: UUID): Promise<Order | null> {
    const orders = await this.getOrdersByUserId(userId);
    const [order] = orders.sort((a, b) =>
      sortDateAsc(a.timestamp, b.timestamp),
    );
    return order || null;
  }

  async migrate({
    prevUserId,
    newUserId,
  }: {
    prevUserId: UUID;
    newUserId: UUID;
  }): Promise<Order[]> {
    const result = await sql`
      UPDATE orders
      SET "user" = ${newUserId}
      WHERE "user" = ${prevUserId}`;
    return result.rows as Order[];
  }
}
