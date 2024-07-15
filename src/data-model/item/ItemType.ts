import { UUID } from 'crypto';

export type ItemCategory = 'espresso' | 'coffee' | 'syrup' | 'extras';

//
//// OPTIONS
//
type BaseMod = {
  id: UUID;
  name: string;
  price: number;
  currency: 'eth' | 'usd';
  isOptional: boolean;
};

export type NumericMod = BaseMod & {
  value: number | null;
  type: 'number';
};

export type BooleanMod = BaseMod & {
  value: boolean | null;
  type: 'boolean';
};

export type ItemMod = NumericMod | BooleanMod;

//
//// ITEM
///
export type Item = {
  id: UUID;
  name: string;
  price: number;
  currency: 'eth' | 'usd';
  description: string;
  image: string;
  // mods: UUID[];
};
