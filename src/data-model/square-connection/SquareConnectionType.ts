import { UUID } from 'crypto';

export type BaseSquareConnection = {
  id: UUID;
  userId: UUID;
  /**
   * Square's merchant id - representing a unique shop
   */
  merchantId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type DecryptedSquareConnection = BaseSquareConnection & {
  accessToken: string;
  refreshToken: string;
};

export type SquareConnection = DecryptedSquareConnection;
