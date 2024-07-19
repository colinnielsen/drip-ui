import { ManualStoreConfig } from '@/data-model/shop/ShopType';

export const USDC_ADDRESS_BASE =
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as const;

export const ONBOARDED_SHOPS: ManualStoreConfig[] = [
  {
    sliceId: 805,
    sliceVersion: 1,
    location: [35.681236, 139.767173],
    name: 'ベースカフェ (Base Cafe)',
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
  {
    sliceId: 769,
    sliceVersion: 1,
    location: [35.681236, 139.767173],
    name: 'Test Cafe',
    logo: '/cha-cha-logo.jpg',
    backgroundImage: '/cha-cha.jpg',
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
