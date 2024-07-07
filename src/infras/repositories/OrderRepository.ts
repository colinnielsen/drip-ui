// src/infrastructure/repositories/implementations/InMemoryCafeRepository.ts
import { Item, ItemMod } from "@/data-model/item/ItemType";
import { Order, OrderItem } from "@/data-model/order/OrderType";
import {
  OrderRepository,
  UpdateOrderOperation,
} from "@/data-model/order/OrderRepository";
import { UUID } from "crypto";
import { v4 } from "uuid";
import { sleep } from "@/lib/utils";

const SLEEP_MS = 600;

export class InMemoryOrderRepository implements OrderRepository {
  private items: Map<UUID, Order> = new Map();

  constructor() {
    this.items = new Map();
  }

  async findById(id: UUID): Promise<Order | null> {
    await sleep(SLEEP_MS);
    return this.items.get(id) || null;
  }

  async save(cafeId: UUID, userId: UUID, items: OrderItem[]): Promise<Order> {
    let id = v4() as UUID;
    let orderItem: Order = {
      id,
      cafe: cafeId,
      user: userId,
      status: "pending",
      timestamp: Date().toString(),
      orderItems: items,
    };

    await sleep(SLEEP_MS);
    this.items.set(id, orderItem);

    return orderItem;
  }

  async update(
    orderId: UUID,
    operations: UpdateOrderOperation[]
  ): Promise<Order> {
    await sleep(SLEEP_MS);
    const order = this.items.get(orderId);
    if (!order) throw Error("Order not found");

    for (const op of operations) {
      let orderId: number;

      switch (op.__type) {
        case "add":
          order.orderItems.push(op.item);
          break;
        case "delete":
          orderId = order.orderItems.findIndex((o) => o.id === op.itemId);
          if (orderId == -1) throw Error("bad order id");
          order.orderItems.splice(orderId);
          break;
        case "update":
          orderId = order.orderItems.findIndex((o) => o.id === op.itemId);
          if (orderId == -1) throw Error("bad order id");
          order.orderItems[orderId] = op.item;
          break;
        default:
          let err: never;
          throw Error("bad impl");
      }
    }

    return order;
  }

  async delete(id: UUID): Promise<void> {
    if (!this.items.delete(id)) throw Error("could not delete");
  }

  async clear(orderId: UUID): Promise<Order> {
    await sleep(SLEEP_MS);
    const order = this.items.get(orderId);
    if (!order) throw Error("Order not found");

    order.orderItems = [];

    return order;
  }

  async getOrdersByUserId(userId: UUID): Promise<Order[]> {
    return Array.from(this.items.values()).filter((o) => o.user === userId);
  }

  async getActiveUserOrders(userId: UUID): Promise<Order[]> {
    return this.getOrdersByUserId(userId).then((orders) =>
      orders
        .filter((o) => o.status !== "complete")
        .sort((a, b) =>
          new Date(a.timestamp) < new Date(b.timestamp) ? -1 : 1
        )
    );
  }
}
