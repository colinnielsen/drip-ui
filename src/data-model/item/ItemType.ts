import { UUID } from 'crypto';
import { Currency, SupportedCurrency } from '../_common/type/CommonType';

export type ItemCategory = 'espresso' | 'coffee' | 'tea' | 'food';

export type ItemPrice = {
  itemId: UUID;
  mods?: UUID[];
  basePrice: Currency;
  discountPrice?: Currency;
  discountPercentage: number;
};

type ModSourceConfig =
  | {
      type: 'slice';
      /**
       * the variant id in the slice store
       */
      id: string;
      version: number;
    }
  | {
      type: 'square';
      id: string;
    };

//
//// OPTIONS
//
type BaseMod = {
  id: UUID;
  __sourceConfig: ModSourceConfig;
  type: 'exclusive' | 'inclusive';
  category: ItemCategory | null;
  name: string;
  price: Currency;
  /**
   * @dev if the mod is onsale, this should be the price the user pays
   */
  discountPrice?: Currency;
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

type ItemSourceConfig =
  | {
      type: 'slice';
      /**
       * the product item id in the slice store
       */
      id: string;
      version: number;
    }
  | {
      type: 'square';
      id: string;
    };

//
//// ITEM
///
export type Item = {
  id: UUID;
  __sourceConfig: ItemSourceConfig;
  name: string;
  price: Currency;
  /**
   * @dev if the item is onsale, this should be the price the user pays
   */
  discountPrice?: Currency;
  currency: SupportedCurrency;
  description: string;
  image: string;
  availability: 'onsite-only' | 'online-only' | 'delivery';
  category: ItemCategory | null;
  mods: ItemMod[];
};
