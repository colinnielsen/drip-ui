import { createFarmer } from '@/data-model/farmer/FarmerDTO';
import { Farmer } from '@/data-model/farmer/FarmerType';
import { ManualStoreConfig } from '@/data-model/shop/ShopType';
import { UUID } from 'crypto';
import { subDays } from 'date-fns';
import { generateUUID } from './utils';

export const STATIC_FARMER_DATA: Farmer[] = [
  createFarmer({
    id: 'A76DA066-F116-4F8B-BAF5-34344132BE2E',
    name: 'Marco Oviedo',
    pfp: '/marco-pfp.png',
    shortDescription:
      'My wife and I run a farm in the beautiful Costa region of Costa Rica',
    image:
      'https://images.squarespace-cdn.com/content/v1/5a8cebefe9bfdf59a2d406ff/1519999467027-LWGK5HC14VTJU60J4LZM/FarmersProject_Sircof_Marco.jpg?format=1000w',
    infoUrl: 'https://www.farmersproject-cr.com/sircof',
    campaigns: [],
    posts: [
      {
        id: generateUUID(),
        images: ['/base-cafe.png'],
        title: 'EthCC 2024',
        content:
          'Base Cafe at EthCC was a huge success 🎉🎉🎉 I received over $600 USDC from this event and I am excited for the future. Thank you to everyone who bought and enjoyed coffees with USDC and the incredible barista team',
        createdAt: subDays(new Date(), 1),
        farmer: 'A76DA066-F116-4F8B-BAF5-34344132BE2E',
      },
    ],
    bio: "My wife and I run a farm in the beautiful Costa region of Costa Rica. Our family coffee farm has been running the past two generations. My wife and I decided to build a micro mill, giving us more control over processing and production. We're using innovative technologies to save our family farm.",
    bioImages: ['/marco-1.jpg', '/marco-2.jpg', '/marco-3.jpg'],
    ethAddress: '0xb8c18E036d46c5FB94d7DeBaAeD92aFabe65EE61',
  }),
];

export const ONBOARDED_SHOPS: ManualStoreConfig[] = [
  {
    __type: 'slice',
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
    __type: 'slice',
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
    __type: 'slice',
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
    tipConfig: {
      __type: 'single-recipient',
      address: '0xcd3E2237f4e9275fEF664d7C9bFA81cD5613c95b',
      enabled: true,
    },
    farmerAllocation: [
      {
        allocationBPS: 300,
        farmer: 'A76DA066-F116-4F8B-BAF5-34344132BE2E',
        id: crypto.randomUUID() as UUID,
      },
    ],
  },
  {
    __type: 'slice',
    sliceId: 769,
    sliceVersion: 1,
    location: {
      label: 'Denver, CO',
      address: "Colin's office",
      coords: [50.8443, 4.3563],
    },
    tipConfig: {
      __type: 'single-recipient',
      address: '0xb8c18E036d46c5FB94d7DeBaAeD92aFabe65EE61',
      enabled: true,
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
