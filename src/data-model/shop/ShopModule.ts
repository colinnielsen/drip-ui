import { InMemoryShopRepository } from '@/infras/repositories/ShopRepository';
import {
  saveOnlineShop,
  saveStorefront,
  getAllShops,
  getShopById,
} from './ShopDTO';

const shopRepository = new InMemoryShopRepository();

export const ShopModule = {
  saveStorefront: saveStorefront(shopRepository),
  saveOnlineShop: saveOnlineShop(shopRepository),
  getShopById: getShopById(shopRepository),
  getAllShops: getAllShops(shopRepository),
};
