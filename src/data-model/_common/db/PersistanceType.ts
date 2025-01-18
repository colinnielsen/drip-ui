import { UUID } from '@/data-model/_common/type/CommonType';
import { Unsaved } from '../type/CommonType';

export type PersistanceLayer<T> = {
  save: (object: Unsaved<T>) => Promise<T>;
  findById: (id: UUID) => Promise<T | null>;
  findByUserId: (userId: UUID) => Promise<T | null>;
  remove: (id: UUID) => Promise<void>;
};
