import { SQLFarmerRepository } from './repositories/SQLFarmerRepository';
import { SQLOrderRepository } from './repositories/SQLOrderRepository';
import { SQLUserRepository } from './repositories/SQLUserRepository';
import { SQLShopRepository } from './repositories/SQLShopRepository';
import { SQLItemRepository } from './repositories/SQLItemRepository';

export const sqlDatabase = {
  farmers: new SQLFarmerRepository(),
  shops: new SQLShopRepository(),
  items: new SQLItemRepository(),
  orders: new SQLOrderRepository(),
  users: new SQLUserRepository(),
};
