import { Item, ItemMod } from './ItemType';

export const convertItemPriceToBigInt = (item: Item | ItemMod): bigint =>
  BigInt(item.price);
