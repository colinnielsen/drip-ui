// src/infrastructure/repositories/implementations/InMemoryCafeRepository.ts
import { UUID } from "crypto";
import { FarmerRepository, Farmer } from "@/data/types-TODO/farmer";
import { farmerData } from "../static-data/StaticFarmerData";

export class InMemoryFarmerRepository implements FarmerRepository {
  private farmers: Map<UUID, Farmer> = new Map();

  constructor() {
    this.farmers = new Map();
    farmerData.forEach((farmer) => this.farmers.set(farmer.id as UUID, farmer));
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
