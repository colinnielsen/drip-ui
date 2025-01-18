import { BaseEntity, Entity } from '@/data-model/__global/entities';
import { UUID } from '@/data-model/_common/type/CommonType';
import { Location } from '@/data-model/_common/type/LocationType';
import { EthAddress } from '../ethereum/EthereumType';
import { FarmerAllocation } from '../farmer/FarmerType';
import { Item } from '../item/ItemType';
import { ItemCategory } from '../item/common';

type SliceVersion = 1;
type SlicerId = number;

export type SliceExternalId = `SLICE_STORE::V${SliceVersion}::${SlicerId}`;

type SquareMerchantId = string;
type SquareLocationId = string;

export type SquareExternalId =
  `SQUARE_STORE::${SquareMerchantId}::${SquareLocationId}`;

export type ShopExternalId = SliceExternalId | SquareExternalId;

///
//// TYPES
///
export type Menu = {
  [category in ItemCategory | 'other' | string]: Item[];
};

export type SingleRecipientConfig = {
  __type: 'single-recipient';
  recipient: EthAddress;
};

export type TipConfig = SingleRecipientConfig;

//
//// SHOP CONFIGS
//

export type SliceShopConfig = {
  id: UUID;
  __type: 'slice';
  /** The external ID of the slice shop / */
  externalId: SliceExternalId;
  name?: string;
  location: Location;
  logo?: string;
  backgroundImage?: string;
  url?: string;
  farmerAllocation?: FarmerAllocation[];
  tipConfig?: TipConfig;
};

export type SquareShopConfig = {
  id: UUID;
  __type: 'square';
  /** The merchant ID of the square shop concatenated with the location ID */
  externalId: SquareExternalId;
  name?: string;
  location?: Location;
  logo?: string;
  backgroundImage?: string;
  url?: string;
  farmerAllocation?: FarmerAllocation[];
  tipConfig?: TipConfig;
  fundRecipientConfig?: SingleRecipientConfig;
};

export type ShopConfig = SliceShopConfig | SquareShopConfig;

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

export type PhysicalShop = BaseShop & {
  __type: 'storefront';
  location: Location | null;
};

export type PhysicalShopWithLocation = Omit<PhysicalShop, 'location'> & {
  location: Location;
};

export type OnlineShop = BaseShop & {
  __type: 'online';
  url: string;
};

type _Shop = PhysicalShop | OnlineShop;

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
