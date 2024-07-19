import { UUID } from 'crypto';
import { SupportedCurrency } from '../_common/type/CommonType';

export type ItemCategory = 'espresso' | 'coffee' | 'tea' | 'food';

//
//// OPTIONS
//
type BaseMod = {
  id: UUID;
  sliceId: string;
  type: 'exclusive' | 'inclusive';
  name: string;
  /**
   * @dev wei formats
   * @example "123000000000000000"
   */
  price: string;
  /**
   * @dev in string format w/ decimal places
   * @example "1.23"
   */
  prettyPrice: string;
  currencyDecimals: number;
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
  sliceId: string;
  name: string;
  /**
   * @dev wei formats
   * @example "123000000000000000"
   */
  price: string;
  /**
   * @dev in string format w/ decimal places
   * @example "1.23"
   */
  prettyPrice: string;
  currencyDecimals: number;
  currency: 'eth' | 'usdc';
  description: string;
  image: string;
  availability: 'onsite-only' | 'online-only' | 'delivery';
  category: ItemCategory | null;
  mods: ItemMod[];
};
