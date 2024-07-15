// src/infrastructure/repositories/implementations/InMemoryCafeRepository.ts
import { FAKE_DB_SLEEP_MS } from '@/data-model/__global/constants';
import { Unsaved } from '@/data-model/_common/type/CommonType';
import {
  OrderRepository,
  UpdateOrderOperation,
} from '@/data-model/order/OrderRepository';
import { Order, OrderItem, isPending } from '@/data-model/order/OrderType';
import { sleep } from '@/lib/utils';
import { UUID } from 'crypto';
import { v4 } from 'uuid';

export class InMemoryOrderRepository implements OrderRepository {
  private items: Map<UUID, Order> = new Map();

  constructor() {
    this.items = new Map();
  }

  async findById(id: UUID): Promise<Order | null> {
    await sleep(FAKE_DB_SLEEP_MS);
    return this.items.get(id) || null;
  }

  async save(
    cafeId: UUID,
    userId: UUID,
    items: Unsaved<OrderItem>[],
  ): Promise<Order> {
    let id = v4() as UUID;
    let orderItem: Order = {
      id,
      cafe: cafeId,
      user: userId,
      status: 'pending',
      timestamp: Date().toString(),
      orderItems: items.map(i => ({
        id: v4() as UUID,
        ...i,
      })),
    };

    await sleep(FAKE_DB_SLEEP_MS);
    this.items.set(id, orderItem);

    return orderItem;
  }

  async update(
    orderId: UUID,
    operations: UpdateOrderOperation[],
  ): Promise<Order> {
    await sleep(FAKE_DB_SLEEP_MS);
    const order = this.items.get(orderId);
    if (!order) throw Error('Order not found');
    if (!isPending) throw Error('Order is not pending');

    for (const op of operations) {
      let orderId: number;

      switch (op.__type) {
        case 'add':
          if (Array.isArray(op.item))
            order.orderItems = [
              ...order.orderItems,
              ...op.item.map<OrderItem>(o => ({ id: v4() as UUID, ...o })),
            ];
          else order.orderItems.push({ id: v4() as UUID, ...op.item });
          break;
        case 'delete':
          orderId = order.orderItems.findIndex(o => o.id === op.itemId);
          if (orderId == -1) throw Error('bad order id');
          order.orderItems.splice(orderId);
          break;
        case 'update':
          orderId = order.orderItems.findIndex(o => o.id === op.itemId);
          if (orderId == -1) throw Error('bad order id');
          order.orderItems[orderId] = op.item;
          break;
        default:
          let err: never;
          throw Error('bad impl');
      }
    }

    return order;
  }

  async delete(id: UUID): Promise<void> {
    if (!this.items.delete(id)) throw Error('could not delete');
  }

  async clear(orderId: UUID): Promise<Order> {
    await sleep(FAKE_DB_SLEEP_MS);
    const order = this.items.get(orderId);
    if (!order) throw Error('Order not found');

    order.orderItems = [];

    return order;
  }

  async getOrdersByUserId(userId: UUID): Promise<Order[]> {
    return Array.from(this.items.values()).filter(o => o.user === userId);
  }

  async getActiveUserOrder(userId: UUID): Promise<Order | null> {
    return this.getOrdersByUserId(userId).then(
      orders =>
        orders
          .sort((a, b) =>
            new Date(a.timestamp) < new Date(b.timestamp) ? -1 : 1,
          )
          .find(o => o.status === 'pending') ?? null,
    );
  }
}
