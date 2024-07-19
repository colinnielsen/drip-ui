import { Unsaved } from '@/data-model/_common/type/CommonType';
import {
  OrderRepository,
  UpdateOrderOperation,
} from '@/data-model/order/OrderRepository';
import { Order, OrderItem } from '@/data-model/order/OrderType';
import { UUID } from 'crypto';
import { v4 } from 'uuid';
import { JSONRepository } from './JSONRepository';
import { isPending } from '@/data-model/order/OrderDTO';

const FILE_PATH = 'orders.json';

export class JSONOrderRepository
  extends JSONRepository<Order>
  implements OrderRepository
{
  constructor() {
    super(FILE_PATH);
  }

  async findById(id: UUID): Promise<Order | null> {
    const data = await this.readFromFile();
    return data[id] || null;
  }

  async save(
    shopId: UUID,
    userId: UUID,
    items: Unsaved<OrderItem>[],
  ): Promise<Order> {
    const id = v4() as UUID;
    const orderItem: Order = {
      id,
      shop: shopId,
      user: userId,
      status: 'pending',
      timestamp: new Date().toISOString(),
      orderItems: items.map(i => ({
        id: v4() as UUID,
        ...i,
      })),
    };

    const data = await this.readFromFile();
    data[id] = orderItem;
    await this.writeToFile(data);

    return orderItem;
  }

  async update(
    orderId: UUID,
    operations: UpdateOrderOperation[],
  ): Promise<Order> {
    const data = await this.readFromFile();
    const order = data[orderId];
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
        default:
          let _err: never;
          throw Error('bad impl');
      }
    }

    data[orderId] = order;
    await this.writeToFile(data);

    return order;
  }

  async delete(id: UUID): Promise<void> {
    const data = await this.readFromFile();
    if (!data[id]) throw Error('could not delete');
    delete data[id];
    await this.writeToFile(data);
  }

  async clear(orderId: UUID): Promise<Order> {
    const data = await this.readFromFile();
    const order = data[orderId];
    if (!order) throw Error('Order not found');

    order.orderItems = [];
    data[orderId] = order;
    await this.writeToFile(data);

    return order;
  }

  async getOrdersByUserId(userId: UUID): Promise<Order[]> {
    const data = await this.readFromFile();
    return Object.values(data).filter(o => o.user === userId);
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
