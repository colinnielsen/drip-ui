import { InMemoryCafeRepository } from '@/infras/repositories/CafeRepository';
import {
  saveOnlineShop,
  saveStorefront,
  getAllCafes,
  getCafeById,
} from './CafeDTO';

const cafeRepository = new InMemoryCafeRepository();

export const CafeModule = {
  saveStorefront: saveStorefront(cafeRepository),
  saveOnlineShop: saveOnlineShop(cafeRepository),
  getCafeById: getCafeById(cafeRepository),
  getAllCafes: getAllCafes(cafeRepository),
};
