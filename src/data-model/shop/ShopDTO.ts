import { generateUUID } from '@/lib/utils';
import { UUID } from 'crypto';
import {
  Menu,
  OnlineShop,
  Shop,
  Storefront,
  StorefrontWithLocation,
} from './ShopType';

export const DEFAULT_SHOP_LOGO = '';
export const DEFAULT_BACKGROUND_IMAGE = '';

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

export const deriveShopIdFromSliceStoreId = (
  sliceId: number,
  sliceVersion: number,
): UUID => generateUUID(`SLICE_V${sliceVersion}::${sliceId}`);

export const EMPTY_MENU: Menu = {
  espresso: [],
  coffee: [],
  tea: [],
  food: [],
  other: [],
};
