import { InMemoryShopRepository } from '@/infras/repositories/ShopRepository';
import {
  saveOnlineShop,
  saveShopfront,
  getAllShops,
  getShopById,
} from './ShopDTO';

const shopRepository = new InMemoryShopRepository();

export const ShopModule = {
  saveShopfront: saveShopfront(shopRepository),
  saveOnlineShop: saveOnlineShop(shopRepository),
  getShopById: getShopById(shopRepository),
  getAllShops: getAllShops(shopRepository),
};
