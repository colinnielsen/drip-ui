import { UUID } from 'crypto';
import { Farmer } from './FarmerType';

export type FarmerRepository = {
  findById: (id: UUID) => Promise<Farmer | null>;
  findAll: () => Promise<Farmer[]>;
  save: (item: Farmer) => Promise<Farmer>;
  delete: (id: UUID) => Promise<void>;
};
