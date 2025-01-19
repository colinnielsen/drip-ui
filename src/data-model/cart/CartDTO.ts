import { generateUUID } from '@/lib/utils';
import { pipe } from 'effect';
import { Prettify } from 'viem/chains';
import {
  addCurrencies,
  initCurrencyFromType,
  subCurrencies,
} from '../_common/currency/currencyDTO';
import { AllExist, UUID } from '../_common/type/CommonType';
import { ItemMod } from '../item/ItemMod';
import { Item, ItemVariant } from '../item/ItemType';
import {
  addLineItemPrices,
  createLineItemAggregate,
  EMPTY_SUMMARY,
} from '../order/OrderDTO';
import { Cart } from './CartType';
import { PaymentSummary } from '../order/OrderType';

export const calculateCartTotals = (
  cart: Cart,
): Prettify<
  AllExist<
    Pick<
      Cart,
      | 'quotedSubtotal'
      | 'quotedTaxAmount'
      | 'quotedDiscountAmount'
      | 'quotedTotalAmount'
    >
  >
> => {
  const CURRENCY_ZERO = initCurrencyFromType(
    cart.lineItems?.[0]?.variant.price.__currencyType ?? 'USDC',
    0n,
  );

  if (!cart.lineItems.length)
    return {
      quotedSubtotal: CURRENCY_ZERO,
      quotedTaxAmount: CURRENCY_ZERO,
      quotedDiscountAmount: CURRENCY_ZERO,
      quotedTotalAmount: CURRENCY_ZERO,
    };

  const subtotal = addLineItemPrices(cart.lineItems, 'subtotal');
  const taxAmount = CURRENCY_ZERO; // TODO: implement tax calculation
  const discountAmount = CURRENCY_ZERO; // TODO: implement discount calculation

  const total = pipe(
    cart.lineItems,
    li => addLineItemPrices(li, 'total'),
    total => addCurrencies(total, taxAmount),
    total => subCurrencies(total, discountAmount),
    total =>
      addCurrencies(
        total,
        cart.tip?.amount ?? initCurrencyFromType(total.__currencyType, 0n),
      ),
  );

  return {
    quotedSubtotal: subtotal,
    quotedTaxAmount: taxAmount,
    quotedDiscountAmount: discountAmount,
    quotedTotalAmount: total,
  };
};

export const buildInitialFromLineItem = ({
  shopId,
  userId,
  item,
  variant,
  mods,
}: {
  shopId: UUID;
  userId: UUID;
  item: Item;
  variant: ItemVariant;
  mods?: ItemMod[];
}): Cart => {
  const CURRENCY_ZERO = initCurrencyFromType(variant.price.__currencyType, 0n);
  const lineItems = [
    createLineItemAggregate({ item, variant, quantity: 1, mods }),
  ];
  const subtotal = addLineItemPrices(lineItems, 'subtotal');
  const taxAmount = CURRENCY_ZERO;
  // TODO: add discounts
  const discountAmount = CURRENCY_ZERO;

  const total = pipe(
    lineItems,
    li => addLineItemPrices(li, 'total'),
    total => addCurrencies(total, taxAmount),
    total => subCurrencies(total, discountAmount),
  );

  return {
    id: generateUUID(),
    createdTimestamp: new Date(),
    shop: shopId,
    user: userId,
    lineItems,
    discounts: [],
    tip: null,
    quotedSubtotal: subtotal,
    quotedTaxAmount: taxAmount,
    quotedDiscountAmount: discountAmount,
    quotedTotalAmount: total,
  };
};

export const mapCartToPaymentSummary = (cart?: Cart | null): PaymentSummary => {
  if (!cart) return EMPTY_SUMMARY;
  return {
    subtotal: cart.quotedSubtotal || null,
    tax: cart.quotedTaxAmount || null,
    discount: cart.quotedDiscountAmount || null,
    tip: cart.tip?.amount || null,
    total: cart.quotedTotalAmount || null,
  };
};
