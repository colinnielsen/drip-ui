import { InMemoryShopRepository } from './repositories/ShopRepository';
import { InMemoryFarmerRepository } from './repositories/FarmerRepository';
import { InMemoryOrderRepository } from './repositories/OrderRepository';
import { InMemoryUserRepository } from './repositories/UserRepository';

export const database = {
  farmers: new InMemoryFarmerRepository(),
  shops: new InMemoryShopRepository(),
  order: new InMemoryOrderRepository(),
  user: new InMemoryUserRepository(),
};
