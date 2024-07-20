import { Unsaved } from '@/data-model/_common/type/CommonType';
import { Item } from '@/data-model/item/ItemType';
import { UUID } from 'crypto';
import { v4 } from 'uuid';
import { JSONRepository } from './JSONRepository';
import { ItemRepository } from '@/data-model/item/ItemRepository';

const FILE_PATH = 'items.json';

export class JSONItemRepository
  extends JSONRepository<Item>
  implements ItemRepository
{
  constructor() {
    super(FILE_PATH);
  }

  async findById(id: UUID): Promise<Item | null> {
    const data = await this.readFromFile();
    return data[id] || null;
  }

  async findAll(): Promise<Item[]> {
    const data = await this.readFromFile();
    return Object.values(data);
  }

  async save(item: Unsaved<Item>): Promise<Item> {
    const id = v4() as UUID;
    const newItem: Item = { ...item, id };
    const data = await this.readFromFile();
    data[id] = newItem;
    await this.writeToFile(data);
    return newItem;
  }

  async delete(id: UUID): Promise<void> {
    const data = await this.readFromFile();
    delete data[id];
    await this.writeToFile(data);
  }

  // async findByShopId(shopId: UUID): Promise<Item[]> {
  //   const data = await this.readFromFile();
  //   return Object.values(data).filter(item => item.shopId === shopId);
  // }

  // async findModsByItemId(id: UUID): Promise<ItemMod[] | null> {
  //   const item = await this.findById(id);
  //   if (!item) return null;
  //   return item.mods || null;
  // }
}
