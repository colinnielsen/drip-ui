import { Shop } from '@/data-model/shop/ShopType';
import { UUID } from 'crypto';
import { Item, ItemCategory, ItemMod } from '../item/ItemType';

export type ShopRepository = {
  findById: (id: UUID) => Promise<Shop | null>;
  findAll: () => Promise<Shop[]>;
  findItem: (
    id: UUID,
    name: string,
    category?: ItemCategory,
  ) => Promise<Item | null>;
  getItemMods: (shopId: UUID, itemId: UUID) => Promise<ItemMod[]>;
  save: (item: Shop) => Promise<void>;
  delete: (id: UUID) => Promise<void>;
};
