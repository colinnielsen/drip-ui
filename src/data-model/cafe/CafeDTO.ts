import { UUID } from 'crypto';
import { FarmerAllocation, getTotalAllocationBPS } from '../types-TODO/farmer';
import { CafeRepository } from './CafeRepository';
import {
  Cafe,
  OnlineShop,
  Storefront,
  createOnlineShop,
  createStorefront,
} from './CafeType';

export const saveStorefront =
  (repo: CafeRepository) =>
  async (data: Parameters<typeof createStorefront>[0]): Promise<Storefront> => {
    const storefront = createStorefront(data);
    await repo.save(storefront);
    return storefront;
  };

export const saveOnlineShop =
  (repo: CafeRepository) =>
  async (data: Parameters<typeof createOnlineShop>[0]): Promise<OnlineShop> => {
    const onlineShop = createOnlineShop(data);
    await repo.save(onlineShop);
    return onlineShop;
  };

export const getCafeById =
  (repo: CafeRepository) =>
  async (id: UUID): Promise<Cafe | null> => {
    return repo.findById(id);
  };

export const getAllCafes =
  (repo: CafeRepository) => async (): Promise<Cafe[]> => {
    return repo.findAll();
  };

export const getAllocationsById =
  (repo: CafeRepository) =>
  async (id: UUID): Promise<FarmerAllocation[] | null> => {
    let cafe = await repo.findById(id);
    if (!cafe) return null;

    return cafe.farmerAllocations;
  };

export const getTotalAllocationsById =
  (repo: CafeRepository) =>
  async (id: UUID): Promise<number | null> => {
    let allocations = await getAllocationsById(repo)(id);
    if (!allocations) return null;

    return getTotalAllocationBPS(allocations);
  };

export const isStorefront = (cafe: Cafe): cafe is Storefront => {
  return cafe.__type === 'storefront';
};

export const isOnlineShop = (cafe: Cafe): cafe is OnlineShop => {
  return cafe.__type === 'online';
};
