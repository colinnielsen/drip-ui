import { InMemoryFarmerRepository } from "./repositories/FarmerRepository";
import { InMemoryCafeRepository } from "./repositories/CafeRepository";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UUID } from "crypto";

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
        queryFn: () => database.cafes.findAll(),
    });

export const useCafe = (id: UUID) =>
    useQuery({
        queryKey: ["cafe", id],
        queryFn: () => database.cafes.findById(id),
    });
