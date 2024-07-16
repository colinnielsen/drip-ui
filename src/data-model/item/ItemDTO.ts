import { UUID } from 'crypto';
import { Item, BooleanMod, NumericMod } from './ItemType';

export const createItem = (data: {
  id: UUID;
  name: string;
  price: number;
  currency: 'eth' | 'usd';
  description: string;
  image: string;
}): Item => ({
  ...data,
});

export const createBooleanOption = (data: {
  id: UUID;
  name: string;
  price: number;
  currency: 'eth' | 'usd';
  category: string;
  isOptional: boolean;
}): BooleanMod => ({
  id: data.id,
  name: data.name,
  price: data.price,
  currency: data.currency,
  isOptional: data.isOptional,
  value: null,
  type: 'boolean',
});

export const createNumericOption = (data: {
  id: UUID;
  name: string;
  price: number;
  currency: 'eth' | 'usd';
  category: string;
  isOptional: boolean;
}): NumericMod => ({
  id: data.id,
  name: data.name,
  price: data.price,
  currency: data.currency,
  isOptional: data.isOptional,
  value: null,
  type: 'number',
});
