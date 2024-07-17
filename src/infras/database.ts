import { InMemoryShopRepository } from './repositories/ShopRepository';
import { InMemoryFarmerRepository } from './repositories/FarmerRepository';
import { JSONOrderRepository } from './repositories/OrderRepository';
import { JSONUserRepository } from './repositories/UserRepository';

export const database = {
  farmers: new InMemoryFarmerRepository(),
  shops: new InMemoryShopRepository(),
  orders: new JSONOrderRepository(),
  users: new JSONUserRepository(),
};
