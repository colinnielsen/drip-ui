import { ItemId } from './ItemType';

export const isItemId = (unknown: any) =>
  typeof unknown === 'string' && ItemId.is(unknown);
