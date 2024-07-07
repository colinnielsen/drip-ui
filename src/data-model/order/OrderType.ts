import { UUID } from "crypto";
import { Item, ItemMod } from "../item/ItemType";

export type OrderStatus = "pending" | "in-progress" | "complete";

export type Order = {
  id: UUID;
  status: OrderStatus;
  timestamp: string;
  /** The id of the cafe */
  cafe: UUID;
  /** Id of the user who placed the order */
  user: UUID;
  /** The items the user ordered */
  orderItems: OrderItem[];
};

export type OrderItem = {
  id: UUID;
  item: Item;
  mods: ItemMod[];
};
