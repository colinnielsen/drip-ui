import { Address, Hex, isAddress } from 'viem';
import { ChainId, EthAddress, USDCAuthorization } from './EthereumType';
import { USDC_CONFIG } from '@/lib/contract-config/USDC';
import { randomBytes } from 'crypto';

export const isChainId = (chainId: number | string): chainId is ChainId =>
  Object.values(ChainId).includes(Number(chainId));

export const mapEthAddressToChainId = (ethAddress: EthAddress): ChainId => {
  const [chainId_str] = ethAddress.split('::');
  const chainId = Number(chainId_str);

  if (!isChainId(chainId)) throw new Error('Invalid chain id');

  return chainId;
};

export const mapEthAddressToAddress = (ethAddress: EthAddress): Address => {
  const [_, address] = ethAddress.split('::');

  if (!isAddress(address)) throw new Error('Invalid address');

  return address;
};

export const splitEthAddress = (ethAddress: EthAddress): [ChainId, Address] => {
  const [chainId_str, address] = ethAddress.split('::');
  const chainId = Number(chainId_str);

  if (!isChainId(chainId)) throw new Error('Invalid chain id');
  if (!isAddress(address)) throw new Error('Invalid address');

  return [chainId, address];
};

export const mapToEthAddress = (
  chainId: ChainId,
  address: Address,
): EthAddress => `${chainId}::${address}`;

export const mapToUnsignedUSDCAcuthorization = ({
  from,
  to,
  value,
  validAfter,
}: {
  USDCConfig: (typeof USDC_CONFIG)[ChainId];
  from: Address;
  to: Address;
  value: bigint;
  validAfter?: bigint;
}): Omit<USDCAuthorization, 'signature'> => {
  const nowSeconds = BigInt(Math.floor(+new Date() / 1000));

  const nonce = `0x${randomBytes(32).toString('hex')}` as const;

  return {
    from,
    to,
    value: value,
    validAfter: validAfter ?? nowSeconds - 10n,
    // one day
    validBefore: nowSeconds + BigInt(60 * 60 * 24),
    nonce,
  };
};
