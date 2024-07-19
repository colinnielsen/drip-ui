import { UUID } from 'crypto';
import { Unsaved } from '../_common/type/CommonType';
import { Item, ItemMod } from './ItemType';

export type ItemRepository = {
  findById: (itemId: UUID) => Promise<Item | null>;
  save: (item: Unsaved<Item>) => Promise<Item>;
  delete: (itemId: UUID) => Promise<void>;
  findAll: () => Promise<Item[]>;
  // findByCategory: (category: string) => Promise<Item[]>;
  // findModsByItemId: (itemId: UUID) => Promise<ItemMod[] | null>;
};
