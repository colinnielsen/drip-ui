import { UUID } from 'crypto';
import { Unsaved } from '../type/CommonType';

export type PersistanceLayer<T> = {
  save: (object: Unsaved<T>) => Promise<T>;
  findById: (id: UUID) => Promise<T | null>;
  findByAttribute: (attribute: keyof T, value: T[keyof T]) => Promise<T | null>;
  remove: (id: UUID) => Promise<void>;
};
