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
  {
    name: 'transfer',
    inputs: [
      {
        name: 'recipient',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const BASE_RPC_CONFIG = {
  chains: [base],
  transport: http(
    'https://base-mainnet.g.alchemy.com/v2/6XLCQYYWBLRr-UwF8QQeYQ2l2g7KOgKZ',
  ),
} as const;

export const BASE_CLIENT = createPublicClient(BASE_RPC_CONFIG);

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
