import { BaseEntity, Entity } from "@/data/__global/entities";
import { UUID, randomUUID } from "crypto";
import { FarmerAllocation } from "../types-TODO/farmer";

///
//// TYPES
///
export type BaseShop = BaseEntity & {
  __entity: Entity.cafe;
  label: string;
  backgroundImage: string;
  logo: string;
  url?: string;
  farmerAllocations: FarmerAllocation[];
};

export type Storefront = BaseShop & {
  __type: "storefront";
  location: Location | null;
};

export type OnlineShop = BaseShop & {
  __type: "online";
  url: string;
};

export type Cafe = Storefront | OnlineShop;

///
//// FACTORIES
///
export const createStorefront = (data: {
  label: string;
  location?: Location;
  url?: string;
  farmerAllocation?: FarmerAllocation[];
}): Storefront => ({
  id: randomUUID(),
  __entity: Entity.cafe,
  __type: "storefront",
  url: data.url,
  label: data.label,
  location: data.location || null,
  farmerAllocations: data.farmerAllocation || [],
});

export const createOnlineShop = (data: {
  label: string;
  url: string;
  farmerAllocation?: FarmerAllocation[];
}): OnlineShop => ({
  id: randomUUID(),
  __entity: Entity.cafe,
  __type: "online",
  label: data.label,
  url: data.url,
  farmerAllocations: data.farmerAllocation || [],
});
