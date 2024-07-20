// src/infrastructure/repositories/implementations/InMemoryShopRepository.ts
import { Item, ItemCategory, ItemMod } from '@/data-model/item/ItemType';
import { ShopRepository } from '@/data-model/shop/ShopRepository';
import { Shop } from '@/data-model/shop/ShopType';
import { UUID } from 'crypto';
import { JSONRepository } from './JSONRepository';

const FILE_PATH = 'shops.json';

export class JSONShopRepository
  extends JSONRepository<Shop>
  implements ShopRepository
{
  constructor() {
    super(FILE_PATH);
  }

  async findById(id: UUID): Promise<Shop | null> {
    const data = await this.readFromFile();
    return data[id] || null;
  }

  async findAll(): Promise<Shop[]> {
    const data = await this.readFromFile();
    return Object.values(data);
  }

  async findItem(shopId: UUID, nameOrID: UUID | string): Promise<Item | null> {
    throw new Error('unimplemented');
    // const shop = await this.findById(shopId);
    // if (!shop) return null;

    // const isFindByName = !validate(nameOrID);
    // const items = Object.values(shop.menu).flat();

    // return (
    //   items.find(item =>
    //     isFindByName ? item.name === nameOrID : item.id === nameOrID,
    //   ) || null
    // );
  }

  // async findCategoryOptions(
  //   id: UUID,
  //   category: ItemCategory,
  // ): Promise<Map<ItemCategory, ItemMod[]> | null> {
  //   const shop = await this.findById(id);
  //   if (!shop) return null;

  //   const categoryOptions = shop.categoryOptions[category];
  //   if (!categoryOptions)
  //     throw new Error(`No category options found for category ${category}`);

  //   const optionMap = new Map<ItemCategory, ItemMod[]>();

  //   for (const cat of categoryOptions) {
  //     const options = shop.options[cat];
  //     if (!options) throw new Error(`No options found for category ${cat}`);
  //     optionMap.set(cat, options);
  //   }

  //   return optionMap;
  // }

  async getItemMods(shopId: UUID, itemId: UUID): Promise<ItemMod[]> {
    // throw Error('unimplemented');

    const item = await this.findItem(shopId, itemId);
    if (!item) throw Error('findItemMods() > item not found');
    return item.mods;
  }

  async save(shop: Shop): Promise<Shop> {
    const data = await this.readFromFile();
    data[shop.id] = shop;
    await this.writeToFile(data);
    return shop;
  }

  async delete(id: UUID): Promise<void> {
    const data = await this.readFromFile();
    if (!data[id]) throw Error('could not delete');
    delete data[id];
    await this.writeToFile(data);
  }
}
