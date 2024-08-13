import { UUID } from 'crypto';
import { Farmer, FarmerPost } from './FarmerType';

export type FarmerRepository = {
  findById: (id: UUID) => Promise<Farmer | null>;
  findAll: () => Promise<Farmer[]>;
  save: (item: Farmer) => Promise<Farmer>;
  savePosts: (posts: FarmerPost[]) => Promise<void>;
  delete: (id: UUID) => Promise<void>;
};
