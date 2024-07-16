// src/infrastructure/repositories/implementations/InMemoryShopRepository.ts
import { ShopRepository } from '@/data-model/shop/ShopRepository';
import { Shop } from '@/data-model/shop/ShopType';
import { UUID } from 'crypto';
import { STATIC_SHOP_DATA } from '../static-data/StaticShopData';
import { Item, ItemCategory, ItemMod } from '@/data-model/item/ItemType';
import { validate } from 'uuid';
import { sleep } from '@/lib/utils';
import { FAKE_DB_SLEEP_MS } from '@/data-model/__global/constants';

export class InMemoryShopRepository implements ShopRepository {
  private shops: Map<UUID, Shop> = new Map();

  constructor() {
    this.shops = new Map();
    STATIC_SHOP_DATA.forEach(shop => this.shops.set(shop.id, shop));
  }

  async findById(id: UUID): Promise<Shop | null> {
    await sleep(FAKE_DB_SLEEP_MS);
    return this.shops.get(id) || null;
  }

  async findAll(): Promise<Shop[]> {
    await sleep(FAKE_DB_SLEEP_MS);
    return Array.from(this.shops.values());
  }

  async findItem(shopId: UUID, nameOrID: UUID | string): Promise<Item | null> {
    const shop = await this.findById(shopId);
    if (!shop) return null;

    const isFindByName = !validate(nameOrID);
    const items = Object.values(shop.menu).flat();

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
    const shop = await this.findById(id);
    if (!shop) return null;

    const categoryOptions = shop.categoryOptions[category];
    if (!categoryOptions) {
      throw new Error(`No category options found for category ${category}`);
    }
    const optionMap = new Map<ItemCategory, ItemMod[]>();

    for (const cat of categoryOptions) {
      const options = shop.options[cat];
      if (!options) {
        throw new Error(`No options found for category ${cat}`);
      }
      optionMap.set(cat, options);
    }

    return optionMap;
  }

  async getItemMods(shopId: UUID, itemId: UUID): Promise<ItemMod[]> {
    throw Error('unimplemented');

    const item = await this.findItem(shopId, itemId);
    if (!item) throw Error('findItemMods() > item not found');
  }

  async save(shop: Shop): Promise<void> {
    this.shops.set(shop.id as UUID, shop);
  }

  async delete(id: UUID): Promise<void> {
    this.shops.delete(id);
  }
}
