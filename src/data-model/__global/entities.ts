import { UUID } from '@/data-model/_common/type/CommonType';

export enum Entity {
  shop = 'shop',
  user = 'user',
  farmer = 'farmer',
  item = 'item',
  order = 'order',
}

export type BaseEntity = {
  id: UUID;
  __entity: Entity;
};
