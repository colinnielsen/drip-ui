import { UUID } from 'crypto';
import { PrivyDID } from '../_external/privy';
import { mapPrivyIdToUserId } from './UserDTO';

const COLIN_PRIVY_ID = 'did:privy:clyoxt6w201xt3i8one16peqj';
export const TESTING_USER_UUID = mapPrivyIdToUserId(COLIN_PRIVY_ID);

export const TESTING_USER: User = {
  __type: 'user',
  id: TESTING_USER_UUID,
  authServiceId: {
    __type: 'privy',
    id: COLIN_PRIVY_ID,
  },
  createdAt: '2024-02-20T12:00:00Z',
  wallet: {
    __type: 'embedded',
    address: '0xe2B28b58cc5d34872794E861fd1ba1982122B907',
  },
  role: 'admin',
} as const;

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

export type SavedUser = {
  __type: 'user';
  id: UUID;
  role: 'admin' | 'user';
  /**
   * @dev the `authServiceId` is the user id from the external service used to verify the user
   */
  authServiceId?: {
    __type: 'privy';
    id: PrivyDID;
  };
  wallet: {
    __type: WalletConnectorType;
    address: `0x${string}`;
  };
  createdAt: string;
};

export type User = SessionUser | SavedUser;
