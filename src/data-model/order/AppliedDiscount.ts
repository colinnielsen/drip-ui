import { UUID } from '@/data-model/_common/type/CommonType';
import { Currency } from '../_common/currency';
import { Order } from './OrderType';
import { LineItem } from './LineItemAggregate';

type DiscountScope = 'ITEM' | 'ORDER' | 'USER' | 'CATEGORY';

/**
 * An applied discount is a discount given to a user on an {@link Order} or a {@link LineItem}
 */
export type AppliedDiscount = {
  discountId: UUID;
  /** the reason / a description for the discount application */
  name: string;
  amount: Currency & {};
  type: 'PERCENTAGE' | 'FIXED';
  scope: DiscountScope & {};
};
