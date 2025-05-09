import { Currency } from '../_common/currency';
import { USDC } from '../_common/currency/USDC';
import { UUID } from '../_common/type/CommonType';
import { Discount } from '../discount/DiscountType';
import { LineItem } from '../order/LineItemAggregate';

export type Cart = {
  id: UUID;
  createdTimestamp: Date;
  /** The id of the shop the cart's associated with */
  shop: UUID;
  /** The items the user ordered */
  lineItems: LineItem[];
  /** all discounts applied on this cart */
  discounts?: Discount[] | null;
  /** the tip amount */
  tip?: {
    amount: USDC;
  } | null;
  /** The additive price of all the line-items and their mods */
  quotedSubtotal?: Currency | null;
  /** The amount of tax applied on the order */
  quotedTaxAmount?: Currency | null;
  /** The total amount of discounts */
  quotedDiscountAmount?: Currency | null;
  /** The final total amount, meaning the subtotal + tip + tax - discounts */
  quotedTotalAmount?: Currency | null;
};
