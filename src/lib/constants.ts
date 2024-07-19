import { ManualStoreConfig } from '@/data-model/shop/ShopType';
import { createClient, getContract, http } from 'viem';
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

export const ONBOARDED_SHOPS: ManualStoreConfig[] = [
  {
    sliceId: 799,
    sliceVersion: 1,
    location: {
      label: 'Montgomery, AL',
      address: '39 Dexter Ave suite 102, Montgomery, AL 36104',
      coords: [32.3792, 86.3077],
    },
    name: 'Prevail Coffee',
    logo: '/prevail.png',
    url: 'https://prevailcoffee.com/',
    backgroundImage: '/prevail-background.jpg',
    farmerAllocation: [
      {
        allocationBPS: 300,
        farmer: '2-2-3-4-5',
        id: '2-2-3-4-5',
      },
    ],
  },
  {
    sliceId: 827,
    sliceVersion: 1,
    location: {
      label: 'Oakland, CA',
      address: '377 2ND ST, OAKLAND, CA 94607',
      coords: [37.7949, -122.2745],
    },
    name: 'Bicycle Coffee Co',
    logo: '/bicycle-coffee.png',
    url: 'https://www.bicyclecoffeeco.com',
    backgroundImage: '/bicycle-background.jpg',
    farmerAllocation: [
      {
        allocationBPS: 300,
        farmer: '2-2-3-4-5',
        id: '2-2-3-4-5',
      },
    ],
  },
  {
    sliceId: 805,
    sliceVersion: 1,
    location: {
      label: 'Bruxelles, Belgium',
      address: 'Mont des Arts, 1000 Bruxelles, Belgium',
      coords: [50.8443, 4.3563],
    },
    name: 'Base Cafe',
    logo: 'https://raw.githubusercontent.com/base-org/brand-kit/8984fe6e08be3058fd7cf5cd0b201f8b92b5a70e/logo/in-product/Base_Network_Logo.svg',
    backgroundImage:
      'https://gvlinweehfwzdcdxkkan.supabase.co/storage/v1/object/public/slicer-images/805/main_6j25kd0y.png',
    farmerAllocation: [
      {
        allocationBPS: 300,
        farmer: '2-2-3-4-5',
        id: '2-2-3-4-5',
      },
    ],
  },
];

export const getPrivyAppId = (): string => {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (appId) return appId;
  throw Error('undefined App ID');
};

export const getPrivySecret = (): string => {
  const secret = process.env.PRIVY_SECRET;
  if (secret) return secret;
  throw Error('undefined App Secret');
};
