import { BaseEntity, Entity } from '@/data-model/__global/entities';
import { FarmerAllocation } from '../farmer/FarmerType';
import { Item, ItemCategory } from '../item/ItemType';
import { Location } from '@/data-model/_common/type/LocationType';
import { SliceStoreId } from '../_common/type/SliceDTO';

export type Menu = {
  [category in ItemCategory | 'other']: Item[];
};

// export type CategoryOptions = Record<ItemCategory, ItemCategory[]>;
// export type Options = Record<ItemCategory, ItemMod[]>;

export type ManualStoreConfig = {
  sliceId: number;
  sliceVersion: number;
  name?: string;
  location: Location;
  logo?: string;
  backgroundImage?: string;
  url?: string;
  farmerAllocation?: [FarmerAllocation];
};

///
//// TYPES
///

export type ShopDataSource = 'slice';

export type BaseShop = BaseEntity & {
  __entity: Entity.shop;
  __sourceConfig: {
    type: 'slice';
    id: SliceStoreId;
    version: number;
  };
  sliceStoreId: SliceStoreId;
  label: string;
  backgroundImage: string;
  logo: string;
  url?: string;
  farmerAllocations: FarmerAllocation[];
  menu: Menu;
  // // NOTE This is a mapping from itemCategory -> ItemCategory[]
  // // It conveys the list of options we should have for a given category
  // // IE espresso should support espresso options + syrup options
  // // So this would be: "espress" -> ["espresso", "syrup"]
  // categoryOptions: CategoryOptions;
  // // NOTE This is a mapping from category to options
  // // This lets each shop configure what options each item category supports
  // options: Options;
  // TODO This might make more sense as [ItemCategory, ItemId] in case there are potential collisions on names?
  // bestsellers is a list of tuples, where the first element is the category and the second is the item name
  bestSellers?: [ItemCategory, string][];
};

export type Storefront = BaseShop & {
  __type: 'storefront';
  location: Location | null;
};

export type OnlineShop = BaseShop & {
  __type: 'online';
  url: string;
};

export type Shop = Storefront | OnlineShop;
