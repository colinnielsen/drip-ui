import { createConfig } from '@privy-io/wagmi';
import { createClient, createPublicClient, getContract, http } from 'viem';
import { base } from 'viem/chains';

export const USDC_ADDRESS_BASE =
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as const;

export const USDC_PARTIAL_ABI = [
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const BASE_RPC_CONFIG = {
  chains: [base],
  transport: http(base.rpcUrls.default.http[0]),
} as const;

export const BASE_CLIENT = createClient(BASE_RPC_CONFIG);

export const USDC_INSTANCE = getContract({
  abi: USDC_PARTIAL_ABI,
  address: USDC_ADDRESS_BASE,
  client: BASE_CLIENT,
});

export const PRIVY_WAGMI_CONFIG = createConfig({
  chains: BASE_RPC_CONFIG.chains,
  transports: {
    '8453': BASE_RPC_CONFIG.transport,
  },
}) as any;

export const isAddressEql = (a?: string, b?: string) => {
  return a?.toLowerCase() === b?.toLowerCase();
};
