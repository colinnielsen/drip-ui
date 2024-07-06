import { InMemoryFarmerRepository } from "./repositories/FarmerRepository";
import { InMemoryCafeRepository } from "./repositories/CafeRepository";
import { useQuery } from "@tanstack/react-query";
import { UUID } from "crypto";
import { ItemCategory } from "@/data-model/types-TODO/item";
import { InMemoryOrderRepository } from "./repositories/OrderRepository";

export const database = {
  farmers: new InMemoryFarmerRepository(),
  cafes: new InMemoryCafeRepository(),
  order: new InMemoryOrderRepository(),
};

export const useFarmers = () =>
  useQuery({
    queryKey: ["farmers"],
    queryFn: async () => await database.farmers.findAll(),
  });

export const farmerQuery = (id: UUID) => ({
  queryKey: ["farmer", id],
  queryFn: async () => await database.farmers.findById(id),
  enabled: !!id,
});

export const useFarmer = (id: UUID) => useQuery(farmerQuery(id));

export const useCafes = () =>
  useQuery({
    queryKey: ["cafes"],
    queryFn: async () => await database.cafes.findAll(),
  });

export const cafeQuery = (id: UUID) => ({
  queryKey: ["cafe", id],
  queryFn: async () => {
    let cafe = await database.cafes.findById(id);
    if (!cafe) throw new Error(`Cafe with id ${id} not found`);
    return cafe;
  },
});

export const useCafe = (id: UUID) => useQuery(cafeQuery(id));

export const useBestSellers = (id: UUID) =>
  useQuery({
    queryKey: ["bestSellers", id],
    queryFn: async () => {
      const cafe = await database.cafes.findById(id);
      if (!cafe) {
        throw new Error(`Cafe with id ${id} not found`);
      }
      if (!cafe.bestSellers) {
        throw new Error(`No best sellers found for cafe with id ${id}`);
      }
      return cafe.bestSellers;
    },
  });

export const useItemByName = (id: UUID, category: ItemCategory, name: string) =>
  useQuery({
    queryKey: ["item", id, category, name],
    queryFn: async () => {
      const item = await database.cafes.findItem(id, category, name);
      if (!item) {
        throw new Error(
          `Item with name ${name} not found in category ${category}`
        );
      }
      return item;
    },
  });

export const useCafeItems = (id: UUID) =>
  useQuery({
    queryKey: ["cafeItems", id],
    queryFn: async () => {
      const cafe = await database.cafes.findById(id);
      if (!cafe) {
        throw new Error(`Cafe with id ${id} not found`);
      }
      return cafe.menu;
    },
  });

export const useCategoryOptions = (id: UUID, category: ItemCategory) =>
  useQuery({
    queryKey: ["menuOptions", id, category],
    queryFn: async () => {
      const options = await database.cafes.findCategoryOptions(id, category);
      if (!options)
        throw new Error(`No options found for category ${category}`);

      return options;
    },
  });
