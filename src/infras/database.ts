import { InMemoryCafeRepository } from "./repositories/CafeRepository";
import { InMemoryFarmerRepository } from "./repositories/FarmerRepository";
import { InMemoryOrderRepository } from "./repositories/OrderRepository";
import { InMemoryUserRepository } from "./repositories/UserRepository";

export const database = {
  farmers: new InMemoryFarmerRepository(),
  cafes: new InMemoryCafeRepository(),
  order: new InMemoryOrderRepository(),
  user: new InMemoryUserRepository(),
};
