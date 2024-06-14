// src/infrastructure/repositories/implementations/InMemoryCafeRepository.ts
import { CafeRepository } from "@/data/cafe/CafeRepository";
import { Cafe } from "@/data/cafe/CafeType";
import { UUID } from "crypto";
import { cafeData } from "../static-data/StaticCafeData";

export class InMemoryCafeRepository implements CafeRepository {
  private cafes: Map<UUID, Cafe> = new Map();

  constructor() {
    this.cafes = new Map();
    cafeData.forEach((cafe) => this.cafes.set(cafe.id as UUID, cafe));
  }

  async findById(id: UUID): Promise<Cafe | null> {
    return this.cafes.get(id) || null;
  }

  async findAll(): Promise<Cafe[]> {
    return Array.from(this.cafes.values());
  }

  async save(cafe: Cafe): Promise<void> {
    this.cafes.set(cafe.id as UUID, cafe);
  }

  async delete(id: UUID): Promise<void> {
    this.cafes.delete(id);
  }
}
