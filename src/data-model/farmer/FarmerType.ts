import { UUID } from 'crypto';

/**
 * Represents a message sent on a farmer's page.
 */
export type FarmerMessage = {
  id: UUID;
  farmer: UUID;
  sendingUser: UUID;
  message: string;
  createdAt: Date;
};

export type FarmerAllocation = {
  id: UUID;
  farmer: UUID;
  allocationBPS: number;
};

export type FarmerCampaign = {
  allocationBPS: number;
  totalRaised: number;
  amountSupported: number;
};

export type FarmerPosts = {
  id: UUID;
  farmer: UUID;
  createdAt: Date;
  /**
   * @format uri
   */
  image: string;
  title: string;
  content: string;
};

export type Farmer = {
  id: UUID;
  name: string;
  /**
   * @format uri
   */
  image: string;
  /**
   * @format uri
   */
  pfp: string;
  campaigns: FarmerCampaign[];
  posts: FarmerPosts[];
  shortDescription: string;
  bio: string;
  bioImages: string[];
  infoUrl: string;
  ethAddress: `0x${string}`;
};
