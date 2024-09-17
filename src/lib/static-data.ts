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
      'https://images.squarespace-cdn.com/content/v1/5a8cebefe9bfdf59a2d406ff/1519999467027-LWGK5HC14VTJU60J4LZM/FarmersProject_Sircof_Marco.webp?format=1000w',
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
      coords: [32.3792, -86.3077],
    },
    name: 'Prevail Coffee',
    logo: '/cafes/prevail.webp',
    url: 'https://prevailcoffee.com/',
    backgroundImage: '/cafes/prevail-background.webp',
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
    logo: '/cafes/bicycle-coffee.webp',
    url: 'https://www.bicyclecoffeeco.com',
    backgroundImage: '/cafes/bicycle-background.webp',
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
    sliceId: 766,
    sliceVersion: 1,
    name: 'Piccolo Caffe e Vino',
    logo: '/cafes/piccolo.webp',
    url: 'https://www.piccolocaffe.ca',
    backgroundImage: '/cafes/piccolo-background.webp',
    location: {
      label: 'Toronto, ON',
      address: '111 John Street, Toronto Ontario, Canada, M5V 2E2',
      coords: [43.647995, -79.38997],
    },
  },
  {
    __type: 'slice',
    sliceId: 815,
    sliceVersion: 1,
    name: "Lion's Milk",
    logo: '/cafes/lions-milk.webp',
    url: 'https://www.lionsmilkbk.com/',
    backgroundImage: '/cafes/lions-milk-background.webp',
    location: {
      label: 'New York, NY',
      address: '104 Roebling St, Brooklyn, NY 11211',
      coords: [40.71590151851203, -73.95575958202109],
    },
  },
  {
    __type: 'slice',
    sliceId: 852,
    sliceVersion: 1,
    name: 'Noun Coffee',
    logo: '/cafes/noun.webp',
    url: 'https://noun.coffee/',
    backgroundImage: '/cafes/noun-background.webp',
    location: {
      label: 'Los Angeles, CA',
      address: '7702 Santa Monica Blvd, West Hollywood, CA 90046',
      coords: [34.09070262919442, -118.35688561636172],
    },
  },
  // {
  //   __type: 'slice',
  //   sliceId: 877,
  //   sliceVersion: 1,
  //   name: 'poorboy coffee',
  //   logo: '/cafes/poorboy.webp',
  //   url: 'https://www.instagram.com/poorboy.coffee/?hl=en',
  //   backgroundImage: '/cafes/poorboy-background.webp',
  //   location: {
  //     label: 'San Francisco, CA',
  //     address: '1235 9th Ave San Francisco, CA 94122',
  //     coords: [37.765287994762986, -122.46652275888438],
  //   },
  // },
  {
    __type: 'slice',
    sliceId: 425,
    sliceVersion: 1,
    name: 'Compass Coffee',
    logo: '/cafes/compass.webp',
    url: 'https://www.compasscoffee.com/',
    backgroundImage: '/cafes/compass-background.webp',
    location: {
      label: 'Washington, DC',
      address: '1201 Half Street, Washington, District of Columbia 20003, USA',
      coords: [38.875350752814555, -77.00768132534003],
    },
  },
  {
    __type: 'slice',
    sliceId: 974,
    sliceVersion: 1,
    name: 'Town Mouse',
    logo: '/cafes/town-mouse.webp',
    url: 'https://www.townmouse.de/',
    backgroundImage: '/cafes/town-mouse-background.webp',
    location: {
      label: 'Berlin, Germany',
      address: 'Marienburger Straße 5, Berlin, Germany 10405',
      coords: [52.53501427738041, 13.42346353801631],
    },
  },
  {
    __type: 'slice',
    sliceId: 1008,
    sliceVersion: 1,
    name: "Menotti's Coffee",
    logo: '/cafes/menottis.webp',
    url: 'https://menottis.com/',
    backgroundImage: '/cafes/menottis-background.webp',
    location: {
      label: 'Los Angeles, CA',
      address: '56 Windward Ave, Venice, CA 90291',
      coords: [33.987311727259836, -118.47271489159513],
    },
  },
  // {
  //   __type: 'slice',
  //   sliceId: 805,
  //   sliceVersion: 1,
  //   location: {
  //     label: 'Bruxelles, Belgium',
  //     address: 'Mont des Arts, 1000 Bruxelles, Belgium',
  //     coords: [50.8443, 4.3563],
  //   },
  //   name: 'Base Cafe',
  //   logo: 'https://raw.githubusercontent.com/base-org/brand-kit/8984fe6e08be3058fd7cf5cd0b201f8b92b5a70e/logo/in-product/Base_Network_Logo.svg',
  //   backgroundImage:
  //     'https://gvlinweehfwzdcdxkkan.supabase.co/storage/v1/object/public/slicer-images/805/main_6j25kd0y.png',
  //   tipConfig: {
  //     __type: 'single-recipient',
  //     address: '0xcd3E2237f4e9275fEF664d7C9bFA81cD5613c95b',
  //     enabled: true,
  //   },
  //   farmerAllocation: [
  //     {
  //       allocationBPS: 300,
  //       farmer: 'A76DA066-F116-4F8B-BAF5-34344132BE2E',
  //       id: crypto.randomUUID() as UUID,
  //     },
  //   ],
  // },
  {
    __type: 'slice',
    sliceId: 769,
    sliceVersion: 1,
    location: {
      label: 'Denver, CO',
      address: "Colin's office",
      coords: [39.738996182282825, -104.99163434025536],
    },
    tipConfig: {
      __type: 'single-recipient',
      address: '0xb8c18E036d46c5FB94d7DeBaAeD92aFabe65EE61',
      enabled: true,
    },
    name: 'The Dev Cafe',
    logo: '/drip.png',
    backgroundImage: '/cafes/mountains.webp',
    farmerAllocation: [
      {
        allocationBPS: 300,
        farmer: 'A76DA066-F116-4F8B-BAF5-34344132BE2E',
        id: crypto.randomUUID() as UUID,
      },
    ],
  },
];
