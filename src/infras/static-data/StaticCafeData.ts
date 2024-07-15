import {
  Cafe,
  createOnlineShop,
  createStorefront,
} from '@/data-model/cafe/CafeType';
import {
  DefaultCategoryOptions,
  DefaultMenu,
  DefaultOptions,
} from './StaticMenuData';
import { farmerAllocations } from './StaticFarmerData';

export const STATIC_CAFE_DATA: Cafe[] = [
  createStorefront({
    id: '1-3-3-4-5',
    label: 'La Cabra',
    location: [35.6895, 139.6917],
    farmerAllocations,
    backgroundImage: '/la-cabra.webp',
    logo: '/la-cabra--icon.jpg',
    menu: DefaultMenu,
    options: DefaultOptions,
    categoryOptions: DefaultCategoryOptions,
  }),
  createStorefront({
    id: '1-4-3-4-5',
    label: 'Cha Cha Matcha',
    location: [35.6895, 139.6917],
    farmerAllocations,
    backgroundImage: '/cha-cha.jpg',
    logo: '/cha-cha-logo.jpg',
    menu: DefaultMenu,
    options: DefaultOptions,
    categoryOptions: DefaultCategoryOptions,
  }),
  createStorefront({
    id: '1-5-3-4-5',
    label: 'WHT R THOZ Roasting Company',
    url: 'https//cafe3.com',
    farmerAllocations,
    backgroundImage: '/background.jpg',
    logo: '/logo.jpg',
    menu: DefaultMenu,
    options: DefaultOptions,
    categoryOptions: DefaultCategoryOptions,
  }),
  createOnlineShop({
    id: '1-5-3-4-9',
    label: 'Sip Happens',
    url: 'https://cafe4.com',
    farmerAllocations,
    backgroundImage: '/background.jpg',
    logo: '/logo.jpg',
    menu: DefaultMenu,
    options: DefaultOptions,
    categoryOptions: DefaultCategoryOptions,
  }),
];
