import { Unsaved, UUID } from '@/data-model/_common/type/CommonType';
import { genericError } from '@/lib/effect';
import { Currency } from '../_common/currency';
import {
  addCurrencies,
  initCurrencyFromType,
  subCurrencies,
} from '../_common/currency/currencyDTO';
import { Cart } from '../cart/CartType';
import { EthAddress } from '../ethereum/EthereumType';
import { ItemMod } from '../item/ItemMod';
import { Item, ItemVariant } from '../item/ItemType';
import { Shop } from '../shop/ShopType';
import { Discount } from '../discount/DiscountType';
import { LineItem, LineItemUniqueId } from './LineItemAggregate';
import {
  ExternalOrderInfo,
  NewOrder,
  Order,
  PaymentSummary,
} from './OrderType';

export const EMPTY_SUMMARY: PaymentSummary = {
  subtotal: null,
  tax: null,
  discount: null,
  tip: null,
  total: null,
};

/**
 * @dev a deterministic id which represents the combo of this variant, mod, and variant
 * @see {@link LineItem.uniqueId}
 */
export function mapVariantAndModsToUniqueId(
  variant: ItemVariant,
  deduplicatedMods: ItemMod[],
): LineItemUniqueId {
  const uniqueId = LineItemUniqueId(
    `${variant.id}_${deduplicatedMods.map(mod => mod.id).join('_')}`,
  );
  return uniqueId;
}

export const getOrderNumber = (order: Order): string | null => {
  return order.externalOrderInfo?.orderNumber || null;
};

export const mapOrderStatusToStatusLabel = (
  status: Order['status'],
  tense: 'present' | 'past' = 'present',
) => {
  switch (status) {
    case '1-submitting':
      return tense === 'present' ? 'Pending' : 'Pending';
    case '2-in-progress':
      return tense === 'present' ? 'In Progress' : 'In Progress';
    case '3-complete':
      return tense === 'present' ? 'Complete' : 'Completed';
    case 'cancelled':
      return tense === 'present' ? 'Cancelled' : 'Cancelled';
    case 'error':
      return tense === 'present' ? 'Error' : 'Errored';
  }
};

export const deriveOrderIdentifierFromOrderId = (orderId: Order['id']) => {
  return orderId.slice(0, 8);
};

export const createExternalOrderInfo = (
  sourceConfig: Shop['__sourceConfig'],
  data: Partial<ExternalOrderInfo>,
): ExternalOrderInfo => {
  const externalOrderInfo = {
    __type: sourceConfig.type,
    orderId:
      data.orderId ??
      (() => {
        throw new Error('orderId is required');
      })(),
    orderNumber: data.orderNumber,
    status: data.status,
  } satisfies ExternalOrderInfo;

  return externalOrderInfo;
};

// export const getOrderItemCostFromPriceDict = (
//   priceDict: Record<UUID, Item | ItemMod>,
//   lineItem: Unsaved<LineItem>,
// ) => {
//   const item = priceDict[lineItem.item.id];

//   return {
//     // add together the base price of the item and the mods
//     price: lineItem.mods.reduce<Currency>(
//       (acc, mod) => addCurrencies(acc, priceDict[mod.id].price ?? USDC.ZERO),
//       item.price,
//     ),
//     // add together the discount price of the item and the mods
//     discountPrice: lineItem.mods.reduce<Currency>(
//       (acc, mod) =>
//         addCurrencies(
//           acc,
//           priceDict[mod.id].discountPrice ??
//             priceDict[mod.id].price ??
//             USDC.ZERO,
//         ),
//       item.discountPrice ?? item.price,
//     ),
//   };
// };

/**
 * @dev get the total cost of an order item based on the mods selected
 */
// export const getOrderItemCost = (orderItem: OrderItem) => {
//   const priceDict = {
//     [orderItem.item.id]: orderItem.item,
//     ...orderItem.mods.reduce((acc, mod) => ({ ...acc, [mod.id]: mod }), {}),
//   };

//   return getOrderItemCostFromPriceDict(priceDict, orderItem);
// };

export const addLineItemPrices = (
  lineItems: LineItem[],
  type: 'subtotal' | 'total',
): Currency => {
  if (!lineItems.length) genericError('No line items');
  if (!lineItems.every(li => li.total.is(lineItems[0].total)))
    genericError('All line items must have the same currency');

  const CURRENCY_ZERO = initCurrencyFromType(
    lineItems[0].variant.price.__currencyType,
    0n,
  );
  return lineItems.reduce<Currency>(
    (acc, li) => addCurrencies(acc, li[type]),
    CURRENCY_ZERO,
  );
};

export function createLineItemAggregate({
  item,
  variant,
  quantity,
  mods,
  discounts,
}: {
  item: Item;
  variant: ItemVariant;
  quantity: number;
  mods?: ItemMod[];
  discounts?: Discount[];
}): LineItem {
  const CURRENCY_ZERO = initCurrencyFromType(variant.price.__currencyType, 0n);
  // deduplicate mods
  const deduplicatedMods: ItemMod[] = (function () {
    if (!mods) return [];

    return Object.values(
      mods.reduce<Record<UUID, ItemMod>>((acc, mod) => {
        const previousCount = acc[mod.id]?.quantity ?? 0;
        const nextMod: ItemMod = { ...mod, quantity: previousCount + 1 };
        acc[mod.id] = nextMod;
        return acc;
      }, {}),
    );
  })();

  const subtotal = (function () {
    // base variant price
    const variantPrice = variant.price;
    // plus all the mods
    const modPrice = deduplicatedMods.reduce<Currency>(
      (acc, mod) =>
        addCurrencies(
          acc,
          // take the mod price and multiply by the quantity
          mod.price.mul(mod.quantity),
        ),
      CURRENCY_ZERO,
    );

    // add together the variant price and the mod price and multiply by the mod price
    const itemAndModPrice = addCurrencies(variantPrice, modPrice);

    // multiply by the quantity
    const subtotal = itemAndModPrice.mul(quantity);

    return subtotal;
  })();

  const totalDiscount = (function () {
    if (!discounts) return CURRENCY_ZERO;

    return discounts.reduce<Currency>(
      (acc, discount) => addCurrencies(acc, discount.amount),
      CURRENCY_ZERO,
    );
  })();

  const total = subCurrencies(subtotal, totalDiscount);

  const uniqueId = mapVariantAndModsToUniqueId(variant, deduplicatedMods);

  return {
    uniqueId,
    item,
    variant,
    quantity,
    mods: deduplicatedMods,
    subtotal,
    discounts,
    totalDiscount,
    total,
  } satisfies LineItem;
}

export const mapOrderToPaymentSummary = (
  cartOrOrder: Order | null | undefined,
): PaymentSummary => {
  if (!cartOrOrder) return EMPTY_SUMMARY;
  return {
    subtotal: cartOrOrder.subtotal || null,
    tax: cartOrOrder.taxAmount || null,
    discount: cartOrOrder.discountAmount || null,
    tip: cartOrOrder.tip?.amount || null,
    total: cartOrOrder.totalAmount || null,
  };
};

export const mapCartToNewOrder = ({
  cart,
  tipRecipient,
}: {
  cart: Cart;
  tipRecipient?: EthAddress;
}): Unsaved<NewOrder> => {
  const [
    {
      subtotal: { __currencyType },
    },
  ] = cart.lineItems;
  const CURRENCY_ZERO = initCurrencyFromType(__currencyType, 0n);

  return {
    timestamp: new Date(),
    shop: cart.shop,
    user: cart.user,
    lineItems: cart.lineItems,
    discounts: cart.discounts,
    tip:
      cart.tip && tipRecipient
        ? { amount: cart.tip.amount, recipient: tipRecipient }
        : null,
    subtotal: cart.quotedSubtotal ?? CURRENCY_ZERO,
    taxAmount: cart.quotedTaxAmount ?? CURRENCY_ZERO,
    discountAmount: cart.quotedDiscountAmount ?? CURRENCY_ZERO,
    totalAmount: cart.quotedTotalAmount ?? CURRENCY_ZERO,
    status: '1-submitting',
    payments: [],
  };
};

// // if all order items have a paid price, then we can use the paid price
// const total_noTip = order.lineItems.every(orderItem => orderItem)
//   ? order.lineItems.reduce((acc, orderItem) => {
//       // const paidForPrice = orderItem.paidPrice;

//       return acc.add(
//         isUSDC(paidForPrice) ? paidForPrice : paidForPrice?.toUSDC(),
//       );
//     }, USDC.ZERO)
//   : // otherwise, we need to use the discount prices and add the mods individually
//     order.lineItems.reduce<USDC>((acc, orderItem) => {
//       const paidForPrice =
//         orderItem.item.discountPrice ?? orderItem.item.price;

//       return acc
//         .add(isUSDC(paidForPrice) ? paidForPrice : paidForPrice.toUSDC())
//         .add(
//           orderItem.mods.reduce((acc, mod) => {
//             const modPrice = mod.discountPrice ?? mod.price;
//             return acc.add(isUSDC(modPrice) ? modPrice : modPrice.toUSDC());
//           }, USDC.ZERO),
//         );
//     }, USDC.ZERO);

// const total_withTip = total_noTip.add(order.tip?.amount ?? USDC.ZERO);

// return {
//   /**
//    * @dev subTotal is the total without the tip
//    */
//   subTotal: {
//     formatted: total_noTip.prettyFormat(),
//     usdc: total_noTip,
//   },
//   tip: order.tip
//     ? {
//         formatted: order.tip.amount.prettyFormat(),
//         usdc: order.tip.amount,
//       }
//     : null,
//   /**
//    * @dev total is the subtotal + tip
//    */
//   total: {
//     formatted: total_withTip.prettyFormat(),
//     usdc: total_withTip,
//   },
// };

export const isSubmitting = (o: Order) => o.status === '1-submitting';

export const isInProgress = (o: Order) => o.status === '2-in-progress';

export const isComplete = (o: Order) => o.status === '3-complete';

export const isPaidOrder = (o: Order) => isInProgress(o);

export const needsSyncing = ({ status }: Order) =>
  status === '1-submitting' || status === '2-in-progress';

export const hasPaymentConfirmed = (o: Order) =>
  isComplete(o) || isInProgress(o);
