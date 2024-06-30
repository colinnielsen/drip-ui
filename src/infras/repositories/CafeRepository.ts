// src/infrastructure/repositories/implementations/InMemoryCafeRepository.ts
import { CafeRepository } from "@/data/cafe/CafeRepository";
import { Cafe } from "@/data/cafe/CafeType";
import { UUID } from "crypto";
import { cafeData } from "../static-data/StaticCafeData";
import { Item, ItemCategory, ItemOption } from "@/data/types-TODO/item";

export class InMemoryCafeRepository implements CafeRepository {
  private cafes: Map<UUID, Cafe> = new Map();

  constructor() {
    this.cafes = new Map();
    cafeData.forEach((cafe) => this.cafes.set(cafe.id as UUID, cafe));
  }

  async findById(id: UUID): Promise<Cafe | null> {
    return this.cafes.get(id) || null;
  }

  async findAll(): Promise<Cafe[]> {
    return Array.from(this.cafes.values());
  }

  async findItem(
    id: UUID,
    category: ItemCategory,
    name: string,
  ): Promise<Item | null> {
    let cafe = await this.findById(id);
    if (!cafe) return null;

    return cafe.menu.get(category)?.find((item) => item.name === name) || null;
  }

  async findCategoryOptions(
    id: UUID,
    category: ItemCategory,
  ): Promise<Map<ItemCategory, ItemOption[]> | null> {
    let cafe = await this.findById(id);
    if (!cafe) return null;

    let categoryOptions = cafe.categoryOptions.get(category);
    if (!categoryOptions) {
      throw new Error(`No category options found for category ${category}`);
    }
    let optionMap = new Map<ItemCategory, ItemOption[]>();

    for (let cat of categoryOptions) {
      let options = cafe.options.get(cat);
      if (!options) {
        throw new Error(`No options found for category ${cat}`);
      }
      optionMap.set(cat, options);
    }

    return optionMap;
  }

  async save(cafe: Cafe): Promise<void> {
    this.cafes.set(cafe.id as UUID, cafe);
  }

  async delete(id: UUID): Promise<void> {
    this.cafes.delete(id);
  }
}
