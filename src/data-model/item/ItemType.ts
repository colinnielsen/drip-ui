import { UUID } from 'crypto';
import { Currency, SupportedCurrency } from '../_common/type/CommonType';

export type ItemCategory = 'espresso' | 'coffee' | 'tea' | 'food';

//
//// OPTIONS
//
type BaseMod = {
  id: UUID;
  __sourceConfig: {
    type: 'slice';
    /**
     * the variant id in the slice store
     */
    id: string;
    version: number;
  };
  type: 'exclusive' | 'inclusive';
  category: ItemCategory | null;
  name: string;
  price: Currency;
  currency: SupportedCurrency;
  isOptional: boolean;
};

// export type NumericMod = BaseMod & {
//   type: 'number';
// };

// export type BooleanMod = BaseMod & {
//   type: 'boolean';
// };

export type ItemMod = BaseMod;

//
//// ITEM
///
export type Item = {
  id: UUID;
  __sourceConfig: {
    type: 'slice';
    /**
     * the product item id in the slice store
     */
    id: string;
    version: number;
  };
  name: string;
  price: Currency;
  currency: SupportedCurrency;
  description: string;
  image: string;
  availability: 'onsite-only' | 'online-only' | 'delivery';
  category: ItemCategory | null;
  mods: ItemMod[];
};
