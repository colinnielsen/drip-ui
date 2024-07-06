import { UUID } from "crypto";
import { v4 } from "uuid";

export type FarmerAllocation = {
  id: UUID;
  farmer: UUID;
  allocationBPS: number;
};

export type FarmerRepository = {
  findById: (id: UUID) => Promise<Farmer | null>;
  findAll: () => Promise<Farmer[]>;
  save: (item: Farmer) => Promise<void>;
  delete: (id: UUID) => Promise<void>;
};

/**
 * Represents a message sent on a farmer's page.
 */
export type Message = {
  farmerId: UUID;
  sendingUserId: UUID;
  message: string;
  grower: string;
};

export type Farmer = {
  id: UUID;
  name: string;
  /**
   * @format uri
   */
  image: string;
  shortDescription: string;
  infoUrl: string;
  ethAddress: `0x${string}`;
};

export const getTotalAllocationBPS = (
  allocations: FarmerAllocation[]
): number => {
  return allocations.reduce((acc, curr) => curr.allocationBPS + acc, 0);
};

export const createFarmer = (data: {
  id: UUID;
  name: string;
  image: string;
  shortDescription: string;
  infoUrl: string;
  ethAddress: `0x${string}`;
}): Farmer => {
  return {
    ...data,
  };
};
