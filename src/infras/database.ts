import { InMemoryShopRepository } from './repositories/ShopRepository';
import { InMemoryFarmerRepository } from './repositories/FarmerRepository';
import { InMemoryOrderRepository } from './repositories/OrderRepository';
import { InMemoryUserRepository } from './repositories/UserRepository';

export const database = {
  farmers: new InMemoryFarmerRepository(),
  shops: new InMemoryShopRepository(),
  orders: new InMemoryOrderRepository(),
  users: new InMemoryUserRepository(),
};
