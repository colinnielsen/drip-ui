import { generateUUID } from '@/lib/utils';
import { pipe } from 'effect';
import { Prettify } from 'viem/chains';
import { Currency } from '../_common/currency';
import {
  addCurrencies,
  initCurrencyFromType,
  subCurrencies,
} from '../_common/currency/currencyDTO';
import { AllExist } from '../_common/type/CommonType';
import { LineItem, LineItemUniqueId } from '../order/LineItemAggregate';
import {
  addLineItemPrices,
  createLineItemAggregate,
  EMPTY_SUMMARY,
} from '../order/OrderDTO';
import { PaymentSummary } from '../order/OrderType';
import { Shop } from '../shop/ShopType';
import { User } from '../user/UserType';
import { Cart } from './CartType';
import { Discount } from '../discount/DiscountType';

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

  const subtotal: Currency = addLineItemPrices(cart.lineItems, 'subtotal');

  const taxAmount: Currency = CURRENCY_ZERO; // TODO: implement tax calculation

  const discountAmount: Currency = (cart.lineItems ?? []).reduce<Currency>(
    (totalDiscount, li) => {
      const totalDiscountOnLineItem =
        li.discounts?.reduce<Currency>(
          (acc, d) => addCurrencies(acc, d.amount),
          CURRENCY_ZERO,
        ) ?? CURRENCY_ZERO;
      // add that to
      return addCurrencies(totalDiscount, totalDiscountOnLineItem);
    },
    CURRENCY_ZERO,
  );

  const total: Currency = pipe(
    cart.lineItems,
    // add the subtatoals of all the prices (not including discounts)
    li => addLineItemPrices(li, 'subtotal'),
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

/** @params either pass the previous cart, or the dependencies required to create a new one */
export const addLineItemToCart = (
  deps:
    | { type: 'update'; cart: Cart; newLineItem: LineItem }
    | {
        type: 'create';
        shopId: Shop['id'];
        userId: User['id'];
        newLineItem: LineItem;
      },
): Cart => {
  // find what the new line items would be
  const nextLineItems: LineItem[] = (function () {
    if (deps.type === 'create') return [deps.newLineItem];
    if (deps.type === 'update') {
      // see if the line item already exists

      const existingLineItem = deps.cart.lineItems.find(
        existing => existing.uniqueId === deps.newLineItem.uniqueId,
      );

      // if it doesn't exist, push it to the list
      if (!existingLineItem) return [...deps.cart.lineItems, deps.newLineItem];

      // if it does exist, update the quantity
      return deps.cart.lineItems.map(existing => {
        if (existing.uniqueId === deps.newLineItem.uniqueId) {
          const nextQuantity = existing.quantity + deps.newLineItem.quantity;

          const nextDiscounts = (existing.discounts || [])?.map(d => {
            if (d.scope !== 'ITEM') return d;
            // take any item-scoped discounts and return the next discount amount
            const originalDiscount: Currency = d.amount.div(existing.quantity);
            const nextAmount: Currency = originalDiscount.mul(nextQuantity);

            const nextDiscount: Discount = {
              ...d,
              amount: nextAmount,
            };
            return nextDiscount;
          });

          const newLineItem = createLineItemAggregate({
            quantity: nextQuantity,
            item: existing.item,
            variant: existing.variant,
            discounts: nextDiscounts,
            mods: existing.mods || [],
          });
          return newLineItem;
        } else return existing;
      });
    }
    let _: never = deps;
    throw new Error("should'nt happen");
  })();
  // update or create the cart
  const updatedCart: Cart = (function () {
    if (deps.type === 'create') {
      const initCart = {
        id: generateUUID(),
        createdTimestamp: new Date(),
        shop: deps.shopId,
        user: deps.userId,
        lineItems: nextLineItems,
        tip: null,
      } satisfies Cart;
      const cart = { ...initCart, ...calculateCartTotals(initCart) };

      return cart;
    }
    if (deps.type === 'update') {
      const cartWithNewLineItems = {
        ...deps.cart,
        lineItems: nextLineItems,
      } satisfies Cart;

      return {
        ...cartWithNewLineItems,
        ...calculateCartTotals(cartWithNewLineItems),
      };
    }
    let _: never = deps;
    throw new Error("should'nt happen");
  })();

  return updatedCart;
};

export const decrementLineItemQuantity = (
  cart: Cart,
  lineItemUniqueId: LineItemUniqueId,
): Cart | null => {
  const nextCart = pipe(
    // pipe over cart
    cart,
    // remove a lineitem
    c => ({
      ...c,
      lineItems: c.lineItems
        .map(lineItem => {
          if (lineItem.uniqueId !== lineItemUniqueId) return lineItem;
          // if the quantity is 1, remove the line item, because the next quantity will be 0
          if (lineItem.quantity === 1) return null;

          const nextQuantity = lineItem.quantity - 1;

          const nextDiscounts = (lineItem.discounts || [])?.map(d => {
            if (d.scope !== 'ITEM') return d;
            // take any item-scoped discounts and return the next discount amount
            const originalDiscount: Currency = d.amount.div(lineItem.quantity);
            const nextAmount: Currency = originalDiscount.mul(nextQuantity);

            const nextDiscount: Discount = {
              ...d,
              amount: nextAmount,
            };
            return nextDiscount;
          });

          return createLineItemAggregate({
            item: lineItem.item,
            quantity: nextQuantity,
            variant: lineItem.variant,
            discounts: nextDiscounts || [],
            mods: lineItem.mods || [],
          });
        })
        // filter out nulls
        .filter(li => !!li),
    }),
    // recalc the cartTotal
    c =>
      ({
        ...c,
        ...calculateCartTotals(c),
      }) satisfies Cart,
    // if the lineItems are empty, return null
    cartWithUpdatedTotals =>
      cartWithUpdatedTotals.lineItems.length === 0
        ? null
        : cartWithUpdatedTotals,
  );

  return nextCart;
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
