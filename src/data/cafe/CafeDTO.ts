import { UUID } from "crypto";
import { CafeRepository } from "./CafeRepository";
import {
  Cafe,
  OnlineShop,
  Storefront,
  createStorefront,
  createOnlineShop,
  Coords,
} from "./CafeType";
import { FarmerAllocation, getTotalAllocationBPS } from "../types-TODO/farmer";

export const addStorefront =
  (repo: CafeRepository) =>
  async (data: {
    label: string;
    backgroundImage: string;
    logo: string;
    location?: Coords;
    farmerAllocations?: FarmerAllocation[];
  }): Promise<Storefront> => {
    const storefront = createStorefront(data);
    await repo.save(storefront);
    return storefront;
  };

export const addOnlineShop =
  (repo: CafeRepository) =>
  async (data: {
    label: string;
    backgroundImage: string;
    logo: string;
    url: string;
    farmerAllocations?: FarmerAllocation[];
  }): Promise<OnlineShop> => {
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
