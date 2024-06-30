import { InMemoryFarmerRepository } from "./repositories/FarmerRepository";
import { InMemoryCafeRepository } from "./repositories/CafeRepository";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UUID } from "crypto";
import { ItemCategory } from "@/data/types-TODO/item";

export const database = {
    farmers: new InMemoryFarmerRepository(),
    cafes: new InMemoryCafeRepository(),
};

export const useFarmers = () =>
    useQuery({
        queryKey: ["farmers"],
        queryFn: () => database.farmers.findAll(),
    });

export const useFarmer = (id: UUID) =>
    useQuery({
        queryKey: ["farmer", id],
        queryFn: () => database.farmers.findById(id),
    });

export const useCafes = () =>
    useQuery({
        queryKey: ["cafes"],
        queryFn: async () => await database.cafes.findAll(),
    });

export const useCafe = (id: UUID) =>
    useQuery({
        queryKey: ["cafe", id],
        queryFn: async () => await database.cafes.findById(id),
    });

export const useBestSellers = (id: UUID) =>
    useQuery({
        queryKey: ["bestSellers", id],
        queryFn: async () => {
            const cafe = await database.cafes.findById(id);
            if (!cafe) return null;
            return cafe.bestSellers;
        },
    });

export const useItemByName = (id: UUID, category: ItemCategory, name: string) =>
    useQuery({
        queryKey: ["item", id, category, name],
        queryFn: async () => {
            const item = await database.cafes.findItem(id, category, name);
            return item;
        },
    });

export const useCafeItems = (id: UUID) =>
    useQuery({
        queryKey: ["cafeItems", id],
        queryFn: async () => {
            const cafe = await database.cafes.findById(id);
            if (!cafe) return null;
            return cafe.menu;
        },
    });

export const useCategoryOptions = (id: UUID, category: ItemCategory) =>
    useQuery({
        queryKey: ["menuOptions", id, category],
        queryFn: async () => {
            return await database.cafes.findCategoryOptions(id, category);
        },
    });
