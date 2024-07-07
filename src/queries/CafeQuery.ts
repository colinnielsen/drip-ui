import { ItemCategory } from "@/data-model/item/ItemType";
import { database } from "@/infras/database";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { UUID } from "crypto";

export const useCafes = () =>
  useQuery({
    queryKey: ["cafes"],
    queryFn: async () => await database.cafes.findAll(),
  });

export const cafeQuery = (id: UUID) => queryOptions({
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
      const item = await database.cafes.findItem(id, name);
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

export const useCategoryOptions = (cafeId: UUID, category: ItemCategory) =>
  useQuery({
    queryKey: ["menuOptions", cafeId, category],
    queryFn: async () => {
      const options = await database.cafes.findCategoryOptions(
        cafeId,
        category
      );
      if (!options)
        throw new Error(`No options found for category ${category}`);

      return options;
    },
  });
