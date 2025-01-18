import { Address, Hex } from 'viem';

export enum ChainId {
  BASE = 8453,
}

export type EthAddress = `${ChainId}::0x${string}`;

export type USDCAuthorization = {
  from: Address;
  to: Address;
  /** amount in wei (1e6) */
  value: bigint;
  /** unix seconds */
  validAfter: bigint;
  /** unix seconds */
  validBefore: bigint;
  /** bytes 32 */
  nonce: Hex;
  /** should be packed as r, s, v */
  signature: Hex;
};
