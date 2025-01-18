import { UUID } from '@/data-model/_common/type/CommonType';

export type MinSquareConnection = {
  id: UUID;
  userId: UUID;
  /**
   * Square's merchant id - representing a unique shop
   */
  merchantId: string;
  businessName: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type DecryptedSquareConnection = MinSquareConnection & {
  accessToken: string;
  refreshToken: string;
};

export type SquareConnection = DecryptedSquareConnection;
