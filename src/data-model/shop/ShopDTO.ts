import { generateUUID } from '@/lib/utils';
import { UUID } from 'crypto';
import {
  Menu,
  OnlineShop,
  Shop,
  SliceExternalId,
  SquareExternalId,
  Storefront,
  StorefrontWithLocation,
} from './ShopType';
import { SLICE_VERSION } from '../_external/data-sources/slice/SliceDTO';

// CONSTANTS
// -----------------------------------------------------------------------------

export const DEFAULT_SHOP_LOGO = '';
export const DEFAULT_BACKGROUND_IMAGE = '';

export const EMPTY_MENU: Menu = {
  espresso: [],
  coffee: [],
  tea: [],
  food: [],
  other: [],
};

// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

export const isStorefront = (shop: Shop): shop is Storefront => {
  return shop.__type === 'storefront';
};

export function isStorefrontWithLocation(
  shop: Shop,
): shop is StorefrontWithLocation {
  return isStorefront(shop) && shop.location !== null;
}

export const isOnlineShop = (shop: Shop): shop is OnlineShop => {
  return shop.__type === 'online';
};

export const isSquareShop = (shop: any): shop is Shop<'square'> => {
  return shop?.__sourceConfig?.type === 'square';
};

// UTILITY FUNCTIONS
// -----------------------------------------------------------------------------

//
/// SLICE

export const deriveShopIdFromSliceStoreId = (
  sliceId: number,
  sliceVersion: number,
): UUID => generateUUID(`SLICE_V${sliceVersion}::${sliceId}`);

export const getSliceExternalIdFromSliceId = (
  sliceId: number,
): SliceExternalId => `SLICE_STORE::V${SLICE_VERSION}::${sliceId}`;

export const getSlicerIdFromSliceExternalId = (
  sliceExternalId: SliceExternalId,
): number => {
  const [, , sliceId] = sliceExternalId.split('::');
  if (!sliceId) throw new Error('Fatal Error parsing slice store id!');

  return parseInt(sliceId);
};

//
/// SQUARE

export const getSqaureExternalId = ({
  merchantId,
  locationId,
}: {
  merchantId: string;
  locationId: string;
}): SquareExternalId => `${merchantId}::${locationId}`;

export const getMerchantIdFromSquareExternalId = (
  externalId: SquareExternalId,
): string => externalId.split('::')[0];

export const getLocationIdFromSquareExternalId = (
  externalId: SquareExternalId,
): string => externalId.split('::')[1];
