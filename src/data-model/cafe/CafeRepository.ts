import { Cafe } from "@/data-model/cafe/CafeType";
import { UUID } from "crypto";
import { Item, ItemCategory, ItemMod } from "../item/ItemType";

export type CafeRepository = {
  findById: (id: UUID) => Promise<Cafe | null>;
  findAll: () => Promise<Cafe[]>;
  findItem: (
    id: UUID,
    name: string,
    category?: ItemCategory
  ) => Promise<Item | null>;
  getItemMods: (cafeId: UUID, itemId: UUID) => Promise<ItemMod[]>;
  save: (item: Cafe) => Promise<void>;
  delete: (id: UUID) => Promise<void>;
};
