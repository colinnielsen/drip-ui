import { BaseEntity, Entity } from "@/data/__global/entities";
import { UUID } from "crypto";
import { v4 } from "uuid";
import { FarmerAllocation } from "../types-TODO/farmer";
import { Item, ItemCategory, ItemOption } from "../types-TODO/item";

export type Coords = [number, number];

///
//// TYPES
///
export type BaseShop = BaseEntity & {
  __entity: Entity.cafe;
  label: string;
  backgroundImage: string;
  logo: string;
  url?: string;
  farmerAllocations: FarmerAllocation[];
  menu: Map<ItemCategory, Item[]>;
  // NOTE This is a mapping from itemCategory -> ItemCategory[]
  // It conveys the list of options we should have for a given category
  // IE espresso should support espresso options + syrup options
  // So this would be: "espress" -> ["espresso", "syrup"]
  categoryOptions: Map<ItemCategory, ItemCategory[]>;
  // NOTE This is a mapping from category to options
  // This lets each cafe configure what options each item category supports
  options: Map<ItemCategory, ItemOption[]>;
  // TODO This might make more sense as [ItemCategory, ItemId] in case there are potential collisions on names?
  // bestsellers is a list of tuples, where the first element is the category and the second is the item name
  bestSellers?: Array<[ItemCategory, string]>;
};

export type Storefront = BaseShop & {
  __type: "storefront";
  location: Coords | null;
};

export type OnlineShop = BaseShop & {
  __type: "online";
  url: string;
};

export type Cafe = Storefront | OnlineShop;

///
//// FACTORIES
///
export const createStorefront = (data: {
  label: string;
  id?: UUID;
  location?: Coords;
  url?: string;
  backgroundImage: string;
  logo: string;
  menu: Map<ItemCategory, Item[]>;
  categoryOptions: Map<ItemCategory, ItemCategory[]>;
  options: Map<ItemCategory, ItemOption[]>;
  farmerAllocations?: FarmerAllocation[];
}): Storefront => ({
  id: data.id || (v4() as UUID),
  __entity: Entity.cafe,
  __type: "storefront",
  location: data.location || null,
  farmerAllocations: data.farmerAllocations || [],
  ...data,
});

export const createOnlineShop = (data: {
  label: string;
  url: string;
  backgroundImage: string;
  logo: string;
  id?: UUID;
  categoryOptions: Map<ItemCategory, ItemCategory[]>;
  options: Map<ItemCategory, ItemOption[]>;
  menu: Map<ItemCategory, Item[]>;
  farmerAllocations?: FarmerAllocation[];
}): OnlineShop => ({
  id: data.id || (v4() as UUID),
  __entity: Entity.cafe,
  __type: "online",
  farmerAllocations: data.farmerAllocations || [],
  ...data,
});
