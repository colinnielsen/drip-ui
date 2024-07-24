import { Unsaved } from '@/data-model/_common/type/CommonType';
import {
  OrderRepository,
  UpdateOrderOperation,
} from '@/data-model/order/OrderRepository';
import { Order, OrderItem } from '@/data-model/order/OrderType';
import { UUID } from 'crypto';
import { sql } from '@vercel/postgres';
import { v4 } from 'uuid';
import { isPending } from '@/data-model/order/OrderDTO';
import { Hash } from 'viem';
import { getTransactionReceipt } from 'viem/actions';
import { BASE_CLIENT } from '@/lib/ethereum';

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
      status: 'pending',
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
    const result = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
    const order = result.rows[0] as Order;
    if (!order) throw Error('Order not found');
    if (!isPending(order)) throw Error('Order is not pending');

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
          order.tip = op.tip;
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

  async pay(orderId: UUID, transactionHash: Hash): Promise<Order> {
    const result = await sql`UPDATE orders
      SET
      "transactionHash" = ${transactionHash},
      "status" = 'in-progress'
      WHERE id = ${orderId}`;
    return result.rows[0] as Order;
  }

  async checkStatus(orderId: UUID): Promise<Order> {
    const result = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
    const [order] = result.rows as [Order];
    if (!order) throw Error('Order not found');

    if (order.status !== 'in-progress') return order;

    const isComplete = await getTransactionReceipt(BASE_CLIENT, {
      hash: order.transactionHash,
    })
      .then(t => t.status === 'success')
      .catch(() => false);

    if (isComplete) {
      const result =
        await sql`UPDATE orders SET status = 'in-progress' WHERE id = ${orderId}`;
      debugger;

      return {
        ...order,
        status: 'complete',
      };
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

  async getActiveUserOrder(userId: UUID): Promise<Order | null> {
    const orders = await this.getOrdersByUserId(userId);
    return (
      orders
        .sort((a, b) =>
          new Date(a.timestamp) < new Date(b.timestamp) ? -1 : 1,
        )
        .find(o => o.status === 'pending') ?? null
    );
  }
}
