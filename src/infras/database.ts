import { InMemoryCafeRepository } from "./repositories/CafeRepository";
import { InMemoryFarmerRepository } from "./repositories/FarmerRepository";
import { InMemoryOrderRepository } from "./repositories/OrderRepository";

export const database = {
  farmers: new InMemoryFarmerRepository(),
  cafes: new InMemoryCafeRepository(),
  order: new InMemoryOrderRepository(),
};
