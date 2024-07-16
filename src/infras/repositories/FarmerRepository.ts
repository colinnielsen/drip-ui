// src/infrastructure/repositories/implementations/InMemoryShopRepository.ts
import { Farmer } from '@/data-model/farmer/FarmerType';
import { FarmerRepository } from '@/data-model/farmer/FarmerRepository';
import { UUID } from 'crypto';
import { STATIC_FARMER_DATA } from '../static-data/StaticFarmerData';
import { sleep } from '@/lib/utils';
import { FAKE_DB_SLEEP_MS } from '@/data-model/__global/constants';

export class InMemoryFarmerRepository implements FarmerRepository {
  private farmers: Map<UUID, Farmer> = new Map();

  constructor() {
    this.farmers = new Map();
    STATIC_FARMER_DATA.forEach(farmer => this.farmers.set(farmer.id, farmer));
  }

  async findById(id: UUID): Promise<Farmer | null> {
    await sleep(FAKE_DB_SLEEP_MS);
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
