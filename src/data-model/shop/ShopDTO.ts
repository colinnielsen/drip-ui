import { UUID } from 'crypto';
import { FarmerAllocation } from '../farmer/FarmerType';
import { getTotalAllocationBPS } from '../farmer/FarmerDTO';
import { ShopRepository } from './ShopRepository';
import {
  Shop,
  OnlineShop,
  Storefront,
  createOnlineShop,
  createStorefront,
} from './ShopType';

export const saveStorefront =
  (repo: ShopRepository) =>
  async (data: Parameters<typeof createStorefront>[0]): Promise<Storefront> => {
    const storefront = createStorefront(data);
    await repo.save(storefront);
    return storefront;
  };

export const saveOnlineShop =
  (repo: ShopRepository) =>
  async (data: Parameters<typeof createOnlineShop>[0]): Promise<OnlineShop> => {
    const onlineShop = createOnlineShop(data);
    await repo.save(onlineShop);
    return onlineShop;
  };

export const getShopById =
  (repo: ShopRepository) =>
  async (id: UUID): Promise<Shop | null> => {
    return repo.findById(id);
  };

export const getAllShops =
  (repo: ShopRepository) => async (): Promise<Shop[]> => {
    return repo.findAll();
  };

export const getAllocationsById =
  (repo: ShopRepository) =>
  async (id: UUID): Promise<FarmerAllocation[] | null> => {
    const shop = await repo.findById(id);
    if (!shop) return null;

    return shop.farmerAllocations;
  };

export const getTotalAllocationsById =
  (repo: ShopRepository) =>
  async (id: UUID): Promise<number | null> => {
    const allocations = await getAllocationsById(repo)(id);
    if (!allocations) return null;

    return getTotalAllocationBPS(allocations);
  };

export const isStorefront = (shop: Shop): shop is Storefront => {
  return shop.__type === 'storefront';
};

export const isOnlineShop = (shop: Shop): shop is OnlineShop => {
  return shop.__type === 'online';
};
