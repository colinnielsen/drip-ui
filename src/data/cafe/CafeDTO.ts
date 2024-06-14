import { UUID } from "crypto";
import { CafeRepository } from "./CafeRepository";
import {
  Cafe,
  OnlineShop,
  Storefront,
  createOnlineShop,
  createStorefront,
} from "./CafeType";
import { FarmerAllocation } from "../types-TODO/farmer";

export const addStorefront =
  (repo: CafeRepository) =>
  async (
    label: string,
    location: Location,
    farmerAllocation?: FarmerAllocation[]
  ): Promise<Storefront> => {
    const storefront = createStorefront({ label, location, farmerAllocation });
    await repo.save(storefront);
    return storefront;
  };

export const addOnlineShop =
  (repo: CafeRepository) =>
  async (
    label: string,
    url: string,
    farmerAllocation?: FarmerAllocation[]
  ): Promise<OnlineShop> => {
    const onlineShop = createOnlineShop({
      label,
      url,
      farmerAllocation,
    });
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

// TODO
// get get total allocations
