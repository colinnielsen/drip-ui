import { UUID } from "crypto";

export type FarmerAllocation = {
  id: UUID;
  allocationBPS: number;
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
