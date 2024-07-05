// src/infrastructure/repositories/implementations/InMemoryCafeRepository.ts
import { Item, ItemOption } from "@/data/types-TODO/item";
import {
  OrderItem,
  OrderRepository,
  UniqueItem,
} from "@/data/types-TODO/order";
import { UUID } from "crypto";
import { v4 } from "uuid";

export class InMemoryOrderRepository implements OrderRepository {
  private items: Map<UUID, OrderItem> = new Map();

  constructor() {
    this.items = new Map();
    // TODO Maybe add static data?
    //cafeData.forEach((cafe) => this.cafes.set(cafe.id as UUID, cafe));
  }

  async findById(id: UUID): Promise<OrderItem | null> {
    return this.items.get(id) || null;
  }

  async findAll(): Promise<OrderItem[]> {
    return Array.from(this.items.values());
  }

  async findUnique(): Promise<UniqueItem[]> {
    throw new Error("Method not implemented.");
  }

  async save(item: Item, options: ItemOption[]): Promise<void> {
    let id = v4() as UUID;
    let orderItem = {
      id,
      item,
      options,
    };
    this.items.set(id, orderItem);
  }

  async update(id: UUID, options: ItemOption[]): Promise<void> {
    let orderItem = this.items.get(id);
    if (!orderItem) {
      throw new Error(`Order item with id ${id} not found`);
    }
    orderItem.options = options;
  }

  async delete(id: UUID): Promise<void> {
    this.items.delete(id);
  }

  async clear(): Promise<void> {
    this.items.clear();
  }
}
