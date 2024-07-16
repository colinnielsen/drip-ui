import { UUID } from 'crypto';

/**
 * Represents a message sent on a farmer's page.
 */
export type Message = {
  farmerId: UUID;
  sendingUserId: UUID;
  message: string;
  grower: string;
};

export type FarmerAllocation = {
  id: UUID;
  farmer: UUID;
  allocationBPS: number;
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
