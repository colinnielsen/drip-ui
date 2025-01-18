import { UUID } from '@/data-model/_common/type/CommonType';
import { Currency } from '../_common/currency';
import { User } from '../user/UserType';

/**
 * Represents a message sent on a farmer's page.
 */
export type FarmerMessage = {
  id: UUID;
  farmer: UUID;
  sendingUser: UUID;
  message: string | null;
  amount: Currency | null;
  createdAt: Date;
};

export type FarmerMessageWithUser = Omit<FarmerMessage, 'sendingUser'> & {
  sendingUser: User;
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

export type FarmerPost = {
  id: UUID;
  farmer: UUID;
  createdAt: Date;
  /**
   * @format uri
   */
  images: string[];
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
  posts: FarmerPost[];
  shortDescription: string;
  bio: string;
  bioImages: string[];
  infoUrl: string;
  ethAddress: `0x${string}`;
};
