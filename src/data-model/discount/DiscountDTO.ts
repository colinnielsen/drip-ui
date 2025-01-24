import { generateUUID } from '@/lib/utils';
import { Currency } from '../_common/currency';
import { ItemId } from '../item/ItemType';
import {
  Discount,
  DiscountId as DiscountIdType,
  DiscountQuote,
} from './DiscountType';
import { Brand } from 'effect';

export const DiscountId = Brand.nominal<DiscountIdType>();

export const mapToDiscountId = (
  itemId: ItemId,
  name: string,
  priceDiff: Currency,
): DiscountIdType =>
  DiscountId(
    generateUUID(
      [itemId, name, priceDiff.toWeiString() + 'ITEM' + 'FIXED'].join('_'),
    ),
  );

export const mapToDiscount = (
  itemId: ItemId,
  name: string,
  priceDiff: Currency,
): Discount => ({
  id: mapToDiscountId(itemId, name, priceDiff),
  name,
  amount: priceDiff,
  scope: 'ITEM',
  type: 'FIXED',
});

export const mapToDiscountQuote = ({
  itemId,
  discountName,
  amount,
}: {
  itemId: ItemId;
  discountName: string;
  amount: Currency;
}): DiscountQuote => ({
  itemId,
  discount: mapToDiscount(itemId, discountName, amount),
});
