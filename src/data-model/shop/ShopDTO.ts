import { generateUUID } from '@/lib/utils';
import { SlicerBasics } from '@slicekit/core';
import { UUID } from 'crypto';
import { Entity } from '../__global/entities';
import { ManualStoreConfig, OnlineShop, Shop, Storefront } from './ShopType';
import { SLICE_VERSION, SliceStoreId } from '../_common/type/SliceDTO';

export const isStorefront = (shop: Shop): shop is Storefront => {
  return shop.__type === 'storefront';
};

export const isOnlineShop = (shop: Shop): shop is OnlineShop => {
  return shop.__type === 'online';
};

export const deriveShopIdFromSliceStoreId = (
  sliceId: number,
  sliceVersion: number,
): UUID => generateUUID(`SLICE_V${sliceVersion}::${sliceId}`);

export const getSliceStoreIdFromSliceId = (sliceId: number): SliceStoreId =>
  `SLICE_STORE::V${SLICE_VERSION}::${sliceId}`;

export const getSlicerIdFromSliceStoreId = (
  sliceStoreId: SliceStoreId,
): number => {
  const [, , sliceId] = sliceStoreId.split('::');
  if (!sliceId) throw new Error('Fatal Error parsing slice store id!');

  return parseInt(sliceId);
};

export const mapSliceStoreToShop = (
  sliceStore: SlicerBasics,
  manualConfig: ManualStoreConfig,
): Shop => ({
  __entity: Entity.shop,
  __type: 'storefront',
  __sourceConfig: {
    type: 'slice',
    id: getSliceStoreIdFromSliceId(sliceStore.id),
    version: SLICE_VERSION,
  },
  id: deriveShopIdFromSliceStoreId(sliceStore.id, SLICE_VERSION),
  tipConfig: manualConfig.tipConfig || {
    __type: 'single-recipient',
    enabled: false,
  },
  menu: {
    espresso: [],
    coffee: [],
    tea: [],
    food: [],
    other: [],
  },
  label: sliceStore.name,
  location: manualConfig.location,
  backgroundImage: manualConfig.backgroundImage || sliceStore.image || '',
  logo: manualConfig.logo || sliceStore.image || '',
  url: manualConfig.url || sliceStore.slicerConfig?.storefrontUrl || '',
  farmerAllocations: manualConfig.farmerAllocation || [],
});
