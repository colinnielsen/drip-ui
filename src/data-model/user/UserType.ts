import { UUID } from '@/data-model/_common/type/CommonType';
import { PrivyDID } from '../_external/PrivyType';
import { Brand } from 'effect';

export type UserId = UUID & Brand.Brand<'UserId'>;
export const UserId = Brand.nominal<UserId>();

export type WalletConnectorType =
  | `injected`
  | `wallet_connect`
  | `coinbase_wallet`
  | `embedded`
  | 'unknown';

export type AuthServiceId = {
  __type: 'privy';
  id: PrivyDID;
  // TODO: sms auth
  // phone: string;
};

export type User = {
  id: UserId;
  authServiceId?: AuthServiceId;
  wallet?: {
    __type: WalletConnectorType;
    address: `0x${string}`;
  } | null;
  /** iso date string */
  createdAt: Date;
};
