// src/infrastructure/repositories/implementations/InMemoryCafeRepository.ts
import { Farmer, FarmerRepository } from "@/data-model/types-TODO/farmer";
import { UUID } from "crypto";
import { STATIC_FARMER_DATA } from "../static-data/StaticFarmerData";

export class InMemoryFarmerRepository implements FarmerRepository {
  private farmers: Map<UUID, Farmer> = new Map();

  constructor() {
    this.farmers = new Map();
    STATIC_FARMER_DATA.forEach((farmer) => this.farmers.set(farmer.id, farmer));
  }

  async findById(id: UUID): Promise<Farmer | null> {
    return this.farmers.get(id) || null;
  }

  async findAll(): Promise<Farmer[]> {
    return Array.from(this.farmers.values());
  }

  async save(farmer: Farmer): Promise<void> {
    this.farmers.set(farmer.id as UUID, farmer);
  }

  async delete(id: UUID): Promise<void> {
    this.farmers.delete(id);
  }
}
