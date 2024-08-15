import { BaseEntity, Entity } from '@/data-model/__global/entities';
import { FarmerAllocation } from '../farmer/FarmerType';
import { Item, ItemCategory } from '../item/ItemType';
import { Location } from '@/data-model/_common/type/LocationType';
import { SliceStoreId } from '../_common/type/SliceDTO';
import { Address } from 'viem';

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

export type ManualStoreConfig = {
  __type: 'slice';
  sliceId: number;
  sliceVersion: number;
  name?: string;
  location: Location;
  logo?: string;
  backgroundImage?: string;
  url?: string;
  farmerAllocation?: [FarmerAllocation];
  tipConfig?: TipConfig;
};

export type ShopDataSource = 'slice';

export type SliceDataSourceConfig = {
  type: ShopDataSource;
  id: SliceStoreId;
  version: number;
};

export type ShopSourceConfig = SliceDataSourceConfig;

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

export type OnlineShop = BaseShop & {
  __type: 'online';
  url: string;
};

export type Shop = Storefront | OnlineShop;
