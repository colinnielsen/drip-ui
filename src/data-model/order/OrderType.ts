import { UUID } from 'crypto';
import { Item, ItemMod } from '../item/ItemType';

export type OrderStatus = 'pending' | 'in-progress' | 'complete';

export const DRIP_TIP_ITEM_NAME = '__drip-tip';

export type OrderItem = {
  id: UUID;
  item: Item;
  mods: ItemMod[];
};

export type Order = {
  id: UUID;
  status: OrderStatus;
  timestamp: string;
  /** The id of the shop */
  shop: UUID;
  /** Id of the user who placed the order */
  user: UUID;
  /** The items the user ordered */
  orderItems: OrderItem[];
};
