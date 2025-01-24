import { UUID } from '@/data-model/_common/type/CommonType';
import { Currency } from '../_common/currency';
import { Order } from '../order/OrderType';
import { LineItem } from '../order/LineItemAggregate';
import { ItemId } from '../item/ItemType';
import { Brand } from 'effect';

type DiscountScope = 'ITEM' | 'ORDER' | 'USER' | 'CATEGORY';

export type DiscountId = string & Brand.Brand<'DiscountId'>;

/**
 * An applied discount is a discount given to a user on an {@link Order} or a {@link LineItem}
 * @example
 * if a coffee is 3 dollars.
 * and a user gets 2 dollars off
 * so the price is now 1 dollar
 * ```
 * {
 *    id: ...
 *    name: 'discount!',
 *    amount: {
 *      __dripType: "USDC"
 *      _wei: '2000000'
 *    }
 *    type: 'FIXED'
 * }
 * ```
 */
export type Discount = {
  id: DiscountId;
  /** the reason / a description for the discount application */
  name: string;
  amount: Currency & {};
  type: 'PERCENTAGE' | 'FIXED';
  scope: DiscountScope & {};
};

export type DiscountQuote = {
  itemId: ItemId;
  discount: Discount;
};
