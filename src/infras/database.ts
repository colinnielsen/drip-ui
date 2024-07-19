import { JSONShopRepository } from './repositories/ShopRepository';
import { InMemoryFarmerRepository } from './repositories/FarmerRepository';
import { JSONOrderRepository } from './repositories/OrderRepository';
import { JSONUserRepository } from './repositories/UserRepository';
import { JSONItemRepository } from './repositories/ItemRepository';

export const database = {
  farmers: new InMemoryFarmerRepository(),
  shops: new JSONShopRepository(),
  items: new JSONItemRepository(),
  orders: new JSONOrderRepository(),
  users: new JSONUserRepository(),
};
