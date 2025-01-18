import { UUID } from '@/data-model/_common/type/CommonType';
import { PrivyDID } from '../_external/privy';

export type SessionUser = {
  /**
   * @dev `session` is a temporary type that is used to represent a user's session pre-signup
   * `user` is a permanent type that is used to represent a user's identity.
   */
  __type: 'session';
  id: UUID;
  role: 'user';
  authServiceId: null;
  wallet: null;
  createdAt: string;
};

export type WalletConnectorType =
  | `injected`
  | `wallet_connect`
  | `coinbase_wallet`
  | `embedded`;

export type AuthServiceId = {
  __type: 'privy';
  id: PrivyDID;
};

export type SavedUser = {
  __type: 'user';
  id: UUID;
  role: 'admin' | 'user';
  /**
   * @dev the `authServiceId` is the user id from the external service used to verify the user
   */
  authServiceId?: AuthServiceId;
  wallet: {
    __type: WalletConnectorType;
    address: `0x${string}`;
  };
  createdAt: string;
};

export type User = SessionUser | SavedUser;
