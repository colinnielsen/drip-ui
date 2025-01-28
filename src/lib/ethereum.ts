import { ChainId } from '@/data-model/ethereum/EthereumType';
import { createConfig } from '@wagmi/core';
import {
  Chain,
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  nonceManager,
  publicActions,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { getDripRelayerPrivateKey } from './constants';
import { USDC_CONFIG } from './contract-config/USDC';
import { UnimplementedPathError } from './effect';

export const mapChainIdToViemChain = (chainId: ChainId): Chain => {
  if (chainId === ChainId.BASE) return base;

  let _: never = chainId;
  throw new UnimplementedPathError(chainId);
};

export const BASE_RPC_CONFIG = {
  chains: [base],
  transport: http(
    'https://base-mainnet.g.alchemy.com/v2/6XLCQYYWBLRr-UwF8QQeYQ2l2g7KOgKZ',
  ),
} as const;

export const getRPCConfig = (chainId: ChainId) => {
  if (chainId === ChainId.BASE) return BASE_RPC_CONFIG;
  let _: never = chainId;
  throw new UnimplementedPathError(chainId);
};

export const getDripRelayerClient = (chainId: ChainId) => {
  const dripAccount = privateKeyToAccount(`0x${getDripRelayerPrivateKey()}`, {
    nonceManager,
  });

  return createWalletClient({
    ...getRPCConfig(chainId),
    name: 'Drip Relayer Client',
    account: dripAccount,
  }).extend(publicActions);
};

export const getDripRelayerAddress = () =>
  privateKeyToAccount(`0x${getDripRelayerPrivateKey()}`).address;

export const BASE_CLIENT = createPublicClient(BASE_RPC_CONFIG);

export const USDC_INSTANCE = getContract({
  abi: USDC_CONFIG[ChainId.BASE].abi,
  address: USDC_CONFIG[ChainId.BASE].address,
  client: BASE_CLIENT,
});

export const WAGMI_CONFIG = createConfig({
  chains: BASE_RPC_CONFIG.chains,
  transports: {
    '8453': BASE_RPC_CONFIG.transport,
  },
});

export const isAddressEql = (a?: string, b?: string) => {
  return a?.toLowerCase() === b?.toLowerCase();
};

export function parseUnits(value: string, decimals: number) {
  let [integer, fraction = '0'] = value.split('.');

  const negative = integer.startsWith('-');
  if (negative) integer = integer.slice(1);

  // trim trailing zeros.
  fraction = fraction.replace(/(0+)$/, '');

  // round off if the fraction is larger than the number of decimals.
  if (decimals === 0) {
    if (Math.round(Number(`.${fraction}`)) === 1)
      integer = `${BigInt(integer) + 1n}`;
    fraction = '';
  } else if (fraction.length > decimals) {
    const [left, unit, right] = [
      fraction.slice(0, decimals - 1),
      fraction.slice(decimals - 1, decimals),
      fraction.slice(decimals),
    ];

    const rounded = Math.floor(Number(`${unit}.${right}`));
    if (rounded > 9)
      fraction = `${BigInt(left) + BigInt(1)}0`.padStart(left.length + 1, '0');
    else fraction = `${left}${rounded}`;

    if (fraction.length > decimals) {
      fraction = fraction.slice(1);
      integer = `${BigInt(integer) + 1n}`;
    }

    fraction = fraction.slice(0, decimals);
  } else {
    fraction = fraction.padEnd(decimals, '0');
  }

  return BigInt(`${negative ? '-' : ''}${integer}${fraction}`);
}

export const basescanTxUrl = (txHash: string) => {
  return `https://basescan.org/tx/${txHash}`;
};

export const basescanAddressUrl = (address: string) => {
  return `https://basescan.org/address/${address}`;
};
