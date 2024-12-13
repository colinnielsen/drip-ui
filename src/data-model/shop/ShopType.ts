import { BaseEntity, Entity } from '@/data-model/__global/entities';
import { Location } from '@/data-model/_common/type/LocationType';
import { UUID } from 'crypto';
import { Address } from 'viem';
import { FarmerAllocation } from '../farmer/FarmerType';
import { Item, ItemCategory } from '../item/ItemType';

type SliceVersion = 1;
type SlicerId = number;

export type SliceExternalId = `SLICE_STORE::V${SliceVersion}::${SlicerId}`;

type SquareMerchantId = string;
type SquareLocationId = string;

export type SquareExternalId = `${SquareMerchantId}::${SquareLocationId}`;

///
//// TYPES
///
export type Menu = {
  [category in ItemCategory | 'other' | string]: Item[];
};

export type SingleRecipientTipConfig =
  | {
      __type: 'single-recipient';
      enabled: false;
    }
  | {
      __type: 'single-recipient';
      enabled: true;
      address: Address;
    };

export type TipConfig = SingleRecipientTipConfig;

//
//// STORE CONFIGS
//

export type SliceStoreConfig = {
  id: UUID;
  __type: 'slice';
  /** The external ID of the slice store / */
  externalId: SliceExternalId;
  name?: string;
  location: Location;
  logo?: string;
  backgroundImage?: string;
  url?: string;
  farmerAllocation?: FarmerAllocation[];
  tipConfig?: TipConfig;
};

export type SquareStoreConfig = {
  id: UUID;
  __type: 'square';
  /** The merchant ID of the square store concatenated with the location ID */
  externalId: SquareExternalId;
  name?: string;
  location?: Location;
  logo?: string;
  backgroundImage?: string;
  url?: string;
  farmerAllocation?: FarmerAllocation[];
  tipConfig?: TipConfig;
};

export type StoreConfig = SliceStoreConfig | SquareStoreConfig;

//
//// SHOPS
//

export type SquareShopSourceConfig = {
  type: 'square';
  merchantId: string;
  locationId: string;
};

export type SliceShopSourceConfig = {
  type: 'slice';
  id: SliceExternalId;
  version: number;
};

export type ShopSourceConfig = SliceShopSourceConfig | SquareShopSourceConfig;

export type BaseShop = BaseEntity & {
  __entity: Entity.shop;
  __sourceConfig: ShopSourceConfig;
  label: string;
  backgroundImage: string;
  logo: string;
  url?: string;
  tipConfig: TipConfig;
  farmerAllocations: FarmerAllocation[];
  menu: Menu;
};

export type Storefront = BaseShop & {
  __type: 'storefront';
  location: Location | null;
};

export type StorefrontWithLocation = Omit<Storefront, 'location'> & {
  location: Location;
};

export type OnlineShop = BaseShop & {
  __type: 'online';
  url: string;
};

type _Shop = Storefront | OnlineShop;

export type Shop<T extends '_any' | ShopSourceConfig['type'] = '_any'> =
  T extends '_any'
    ? _Shop
    : Omit<_Shop, '__sourceConfig'> & {
        __sourceConfig: T extends 'square'
          ? SquareShopSourceConfig
          : SliceShopSourceConfig;
      };

//
//// UTILITIES
//

/**
 * @dev ensures T handles all shop types
 */
export type SatisfiesShopCompatibility<T> = T extends {
  type: Shop['__type'];
}
  ? T
  : never;
