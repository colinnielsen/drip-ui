// src/infrastructure/repositories/implementations/InMemoryCafeRepository.ts
import { CafeRepository } from '@/data-model/cafe/CafeRepository';
import { Cafe } from '@/data-model/cafe/CafeType';
import { UUID } from 'crypto';
import { STATIC_CAFE_DATA } from '../static-data/StaticCafeData';
import { Item, ItemCategory, ItemMod } from '@/data-model/item/ItemType';
import { validate } from 'uuid';

export class InMemoryCafeRepository implements CafeRepository {
  private cafes: Map<UUID, Cafe> = new Map();

  constructor() {
    this.cafes = new Map();
    STATIC_CAFE_DATA.forEach(cafe => this.cafes.set(cafe.id, cafe));
  }

  async findById(id: UUID): Promise<Cafe | null> {
    return this.cafes.get(id) || null;
  }

  async findAll(): Promise<Cafe[]> {
    return Array.from(this.cafes.values());
  }

  async findItem(cafeId: UUID, nameOrID: UUID | string): Promise<Item | null> {
    let cafe = await this.findById(cafeId);
    if (!cafe) return null;

    const isFindByName = !validate(nameOrID);
    const items = Object.values(cafe.menu).flat();

    return (
      items.find(item =>
        isFindByName ? item.name === nameOrID : item.id === nameOrID,
      ) || null
    );
  }

  async findCategoryOptions(
    id: UUID,
    category: ItemCategory,
  ): Promise<Map<ItemCategory, ItemMod[]> | null> {
    let cafe = await this.findById(id);
    if (!cafe) return null;

    let categoryOptions = cafe.categoryOptions[category];
    if (!categoryOptions) {
      throw new Error(`No category options found for category ${category}`);
    }
    let optionMap = new Map<ItemCategory, ItemMod[]>();

    for (let cat of categoryOptions) {
      let options = cafe.options[cat];
      if (!options) {
        throw new Error(`No options found for category ${cat}`);
      }
      optionMap.set(cat, options);
    }

    return optionMap;
  }

  async getItemMods(cafeId: UUID, itemId: UUID): Promise<ItemMod[]> {
    throw Error('unimplemented');

    const item = await this.findItem(cafeId, itemId);
    if (!item) throw Error('findItemMods() > item not found');
  }

  async save(cafe: Cafe): Promise<void> {
    this.cafes.set(cafe.id as UUID, cafe);
  }

  async delete(id: UUID): Promise<void> {
    this.cafes.delete(id);
  }
}
