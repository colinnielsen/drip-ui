import { UUID } from 'crypto';

export enum Entity {
  cafe = 'cafe',
  user = 'user',
  farmer = 'farmer',
  item = 'item',
  order = 'order',
}

export type BaseEntity = {
  id: UUID;
  __entity: Entity;
};
