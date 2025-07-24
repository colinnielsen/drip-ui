import { UUID } from '@/data-model/_common/type/CommonType';
import { generateUUID } from '@/lib/utils';
import { SLICE_VERSION } from '../_external/data-sources/slice/SliceDTO';
import {
  Menu,
  OnlineShop,
  Shop,
  ShopExternalId,
  SliceExternalId,
  SquareExternalId,
  PhysicalShop,
  PhysicalShopWithLocation,
  TipConfig,
  ShopSourceConfig,
  ShopConfig,
} from './ShopType';
import { mapToEthAddress } from '../ethereum/EthereumDTO';
import { ChainId } from '../ethereum/EthereumType';
import { Entity } from '../__global/entities';

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

export const EMPTY_TIP_CONFIG: TipConfig = {
  __type: 'single-recipient',
  recipient: mapToEthAddress(
    ChainId.BASE,
    '0x0000000000000000000000000000000000000000',
  ),
} as const;

// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

export const isStorefront = (shop: Shop): shop is PhysicalShop => {
  return shop.__type === 'storefront';
};

export function isStorefrontWithLocation(
  shop: Shop,
): shop is PhysicalShopWithLocation {
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

export const deriveShopConfigIdFromExternalId = (
  param: ShopExternalId | { externalId: ShopExternalId },
): UUID => {
  const externalId = (function () {
    if (typeof param === 'string') return param;
    if (param.externalId) return param.externalId;
    throw new Error('Invalid param type');
  })();

  return generateUUID(externalId);
};

//
/// SLICE

export const mapSliceStoreIdToShopId = (
  sliceId: number,
  sliceVersion: number,
): Shop['id'] => generateUUID(`SLICE_V${sliceVersion}::${sliceId}`);

export const mapSliceExternalIdToShopId = (
  sliceExternalId: SliceExternalId,
): Shop['id'] => {
  const [, , sliceId] = sliceExternalId.split('::');
  return generateUUID(`SLICE_V${SLICE_VERSION}::${sliceId}`);
};

export const mapSliceIdToSliceExternalId = (sliceId: number): SliceExternalId =>
  `SLICE_STORE::V${SLICE_VERSION}::${sliceId}`;

export const mapSliceExternalIdToSliceId = (
  sliceExternalId: SliceExternalId,
): number => {
  const [, , sliceId] = sliceExternalId.split('::');
  if (!sliceId) throw new Error('Fatal Error parsing slice store id!');

  return parseInt(sliceId);
};

//
/// SQUARE

export const mapToSqaureExternalId = ({
  merchantId,
  locationId,
}: {
  merchantId: string;
  locationId: string;
}): SquareExternalId => `SQUARE_STORE::${merchantId}::${locationId}`;

export const mapSquareExternalIdToShopId = (
  squareExternalId: SquareExternalId,
): Shop['id'] => {
  const [, merchantId, locationId] = squareExternalId.split('::');
  return generateUUID(`SQUARE_STORE::${merchantId}::${locationId}`);
};

export const mapSquareExternalIdToMerchantIdFrom = (
  externalId: SquareExternalId,
): string => {
  const [_prefix, merchantId, _locationId] = externalId.split('::');
  if (!merchantId) throw new Error('Fatal Error parsing square merchant id!');

  return merchantId;
};

export const mapSquareExternalIdToLocationId = (
  externalId: SquareExternalId,
): string => {
  const [_prefix, _merchantId, locationId] = externalId.split('::');
  if (!locationId) throw new Error('Fatal Error parsing square location id!');

  return locationId;
};

///
///// COMMON

export const mapShopSourceConfigToExternalId = (
  shopSourceConfig: ShopSourceConfig,
): ShopExternalId => {
  if (shopSourceConfig.type === 'square')
    return mapToSqaureExternalId({
      merchantId: shopSourceConfig.merchantId,
      locationId: shopSourceConfig.locationId,
    });

  if (shopSourceConfig.type === 'slice') return shopSourceConfig.id;

  throw new Error('Invalid shop source config');
};

export const mapShopConfigToShopPreview = (config: ShopConfig): Shop => {
  // Determine if this should be treated as an online or storefront for UI
  const isStorefront = !!config.location;

  // derive a deterministic __sourceConfig for compatibility with existing helpers
  const __sourceConfig =
    config.__type === 'square'
      ? {
          type: 'square' as const,
          merchantId: ((): string => {
            const [, merchantId] = config.externalId.split('::');
            return merchantId ?? '';
          })(),
          locationId: ((): string => {
            const [, _merchantId, locationId] = config.externalId.split('::');
            return locationId ?? '';
          })(),
        }
      : {
          type: 'slice' as const,
          id: config.externalId,
          version: 1,
        };

  const id =
    config.__type === 'square'
      ? mapSquareExternalIdToShopId(config.externalId)
      : mapSliceExternalIdToShopId(config.externalId);

  return {
    id,
    __type: 'storefront',
    __entity: Entity.shop,
    __sourceConfig,
    label: config.name ?? 'Unnamed Cafe',
    backgroundImage: config.backgroundImage ?? '',
    logo: config.logo ?? '',
    url: config.url,
    tipConfig: config.tipConfig ?? EMPTY_TIP_CONFIG,
    farmerAllocations: config.farmerAllocation ?? [],
    menu: EMPTY_MENU,
    // storefront-specific prop
    location: isStorefront ? (config.location ?? null) : null,
  } satisfies PhysicalShop;
};
