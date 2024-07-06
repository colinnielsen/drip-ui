import { InMemoryCafeRepository } from "@/infras/repositories/CafeRepository";
import {
  addOnlineShop,
  addStorefront,
  getAllCafes,
  getCafeById,
} from "./CafeDTO";

const cafeRepository = new InMemoryCafeRepository();

export const CafeModule = {
  addStorefront: addStorefront(cafeRepository),
  addOnlineShop: addOnlineShop(cafeRepository),
  getCafeById: getCafeById(cafeRepository),
  getAllCafes: getAllCafes(cafeRepository),
};
