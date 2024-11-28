import { BaseEntity, Entity } from '@/data-model/__global/entities';
import { FarmerAllocation } from '../farmer/FarmerType';
import { Item, ItemCategory } from '../item/ItemType';
import { Location } from '@/data-model/_common/type/LocationType';
import { SliceStoreId } from '../_external/data-sources/slice/SliceDTO';
import { Address } from 'viem';
import { UUID } from 'crypto';

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

export type SliceStoreConfig = {
  id: UUID;
  __type: 'slice';
  /** The external ID of the slice store / */
  externalId: SliceStoreId;
  name?: string;
  location: Location;
  logo?: string;
  backgroundImage?: string;
  url?: string;
  farmerAllocation?: [FarmerAllocation];
  tipConfig?: TipConfig;
};

export type SquareStoreConfig = {
  id: UUID;
  __type: 'square';
  /** The merchant ID of the square store / */
  externalId: string;
  name?: string;
  location: Location;
  logo?: string;
  backgroundImage?: string;
  url?: string;
  farmerAllocation?: [FarmerAllocation];
  tipConfig?: TipConfig;
};

export type StoreConfig = SliceStoreConfig | SquareStoreConfig;

type SquareDataSourceConfig = {
  type: 'square';
  merchantId: string;
};

export type SliceDataSourceConfig = {
  type: 'slice';
  id: SliceStoreId;
  version: number;
};

export type ShopSourceConfig = SliceDataSourceConfig | SquareDataSourceConfig;

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

export type Shop = Storefront | OnlineShop;
