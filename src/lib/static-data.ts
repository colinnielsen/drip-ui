import { createFarmer } from '@/data-model/farmer/FarmerDTO';
import { Farmer } from '@/data-model/farmer/FarmerType';
import { ManualStoreConfig } from '@/data-model/shop/ShopType';
import { UUID, randomBytes } from 'crypto';
import { zeroAddress } from 'viem';

export const STATIC_FARMER_DATA: Farmer[] = [
  createFarmer({
    id: 'A76DA066-F116-4F8B-BAF5-34344132BE2E',
    name: 'Marco Oviedo',
    image:
      'https://images.squarespace-cdn.com/content/v1/5a8cebefe9bfdf59a2d406ff/1519999467027-LWGK5HC14VTJU60J4LZM/FarmersProject_Sircof_Marco.jpg?format=1000w',
    shortDescription: 'The dopest farmer in town',
    infoUrl: 'https://www.farmersproject-cr.com/sircof',
    ethAddress: zeroAddress,
  }),
  createFarmer({
    id: 'A1EA7B69-C1D9-463E-BCDB-E3F511B9AE4E',
    name: 'Richard Stallman',
    image: '/farmer2.jpg',
    shortDescription: 'The most free and open source farmer in the world',
    infoUrl: 'https://fsf.org',
    ethAddress: `0x${randomBytes(20).toString('hex')}` as `0x${string}`,
  }),
  createFarmer({
    id: 'FE56D758-8379-4565-A192-B87DDF316013',
    name: 'Stichard Rallman',
    image: '/farmer3.jpg',
    shortDescription:
      'The least free and open source farmer in the world. Hates freedom.',
    infoUrl: 'https://fsf.org',
    ethAddress: `0x${randomBytes(20).toString('hex')}` as `0x${string}`,
  }),
];

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
        farmer: 'A76DA066-F116-4F8B-BAF5-34344132BE2E',
        id: crypto.randomUUID() as UUID,
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
        farmer: 'A76DA066-F116-4F8B-BAF5-34344132BE2E',
        id: crypto.randomUUID() as UUID,
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
        farmer: 'A76DA066-F116-4F8B-BAF5-34344132BE2E',
        id: crypto.randomUUID() as UUID,
      },
    ],
  },
  {
    sliceId: 769,
    sliceVersion: 1,
    location: {
      label: 'Denver, CO',
      address: "Colin's office",
      coords: [50.8443, 4.3563],
    },
    name: 'The Dev Cafe',
    logo: '/drip.png',
    backgroundImage: '/mountains.webp',
    farmerAllocation: [
      {
        allocationBPS: 300,
        farmer: 'A76DA066-F116-4F8B-BAF5-34344132BE2E',
        id: crypto.randomUUID() as UUID,
      },
    ],
  },
];
