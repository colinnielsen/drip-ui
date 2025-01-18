import { Currency } from '../_common/currency';
import { ItemMod } from '../item/ItemMod';
import { Item, ItemVariant } from '../item/ItemType';
import { AppliedDiscount } from './AppliedDiscount';

const LineItemUniqueIdSymbol = Symbol('LineItemUniqueId');

export type LineItemUniqueId = string & {
  [LineItemUniqueIdSymbol]: true;
};

/**
 * An aggregate type representing the line item of an order, meaning:
 * - one {@link ItemVariant}
 * - with the same amount of {@link ItemMod | Mods}
 * - with variable `quantity`
 */
export type LineItem = {
  /** a deterministic id which represents the combo of this variant, mod, and variant */
  uniqueId: LineItemUniqueId;
  /** the containing shop item for reference */
  item: Item;
  /** the selected variant */
  variant: ItemVariant;
  /** The amount of {@link ItemVariant} */
  quantity: number;
  mods?: ItemMod[] | null;
  /** The undiscounted price of the item: (variant.price + total mod price) * quantity */
  subtotal: Currency;
  /** Discounts applied to this line item */
  discounts?: AppliedDiscount[] | null;
  /** The sum of the discounts on this line item. Will be a positive amount */
  totalDiscount?: Currency | null;
  /** The total price: subtotal - totalDiscount */
  total: Currency;
};
