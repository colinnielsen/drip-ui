import { err } from '@/lib/utils';
import { addCurrencies } from '../_common/currency/currencyDTO';
import { isUSDC, USDC } from '../_common/currency/USDC';
import { Currency, Unsaved } from '../_common/type/CommonType';
import { Shop } from '../shop/ShopType';
import {
  Cart,
  ExternalOrderInfo,
  Order,
  OrderItem,
  OrderSummary,
  PaidOrder,
} from './OrderType';
import { UUID } from 'crypto';
import { Item, ItemMod } from '../item/ItemType';

export const createExternalOrderInfo = (
  sourceConfig: Shop['__sourceConfig'],
  data: Partial<ExternalOrderInfo>,
): ExternalOrderInfo => {
  const externalOrderInfo: ExternalOrderInfo =
    sourceConfig.type === 'slice'
      ? {
          __type: 'slice',
          ...data,
          orderId:
            data.orderId ??
            (() => {
              throw new Error('orderId is required');
            })(),
        }
      : err('sourceConfig type is not supported');

  return externalOrderInfo;
};

/**
 * @dev if a cart item has the same id and the same mods, then it can be squashed with a quantity
 */
export function collapseDuplicateItems(orderItems: OrderItem[]) {
  const itemMap = new Map<string, [OrderItem, number]>();

  orderItems.forEach(orderItem => {
    const allIds = [
      orderItem.item.id,
      ...orderItem.mods.map(mod => mod.id),
    ].sort();
    const key = allIds.join('-');
    if (itemMap.has(key)) itemMap.get(key)![1] += 1;
    else itemMap.set(key, [orderItem, 1]);
  });

  return Array.from(itemMap.values());
}

export const getOrderItemCostFromPriceDict = (
  priceDict: Record<UUID, Item | ItemMod>,
  orderItem: Unsaved<OrderItem>,
) => {
  const item = priceDict[orderItem.item.id];

  return {
    // add together the base price of the item and the mods
    price: orderItem.mods.reduce<Currency>(
      (acc, mod) => addCurrencies(acc, priceDict[mod.id].price ?? USDC.ZERO),
      item.price,
    ),
    // add together the discount price of the item and the mods
    discountPrice: orderItem.mods.reduce<Currency>(
      (acc, mod) =>
        addCurrencies(
          acc,
          priceDict[mod.id].discountPrice ??
            priceDict[mod.id].price ??
            USDC.ZERO,
        ),
      item.discountPrice ?? item.price,
    ),
  };
};

/**
 * @dev get the total cost of an order item based on the mods selected
 */
export const getOrderItemCost = (orderItem: OrderItem) => {
  const priceDict = {
    [orderItem.item.id]: orderItem.item,
    ...orderItem.mods.map(mod => [mod.id, mod]),
  };

  return getOrderItemCostFromPriceDict(priceDict, orderItem);
};

export const getOrderSummary = (order: Order): OrderSummary => {
  // if all order items have a paid price, then we can use the paid price
  const total_noTip: USDC = order.orderItems.every(
    orderItem => orderItem.paidPrice,
  )
    ? order.orderItems.reduce((acc, orderItem) => {
        const paidForPrice = orderItem.paidPrice!;

        return acc.add(
          isUSDC(paidForPrice) ? paidForPrice : paidForPrice.toUSDC(),
        );
      }, USDC.ZERO)
    : // otherwise, we need to use the discount prices and add the mods individually
      order.orderItems.reduce<USDC>((acc, orderItem) => {
        const paidForPrice =
          orderItem.item.discountPrice ?? orderItem.item.price;

        return acc
          .add(isUSDC(paidForPrice) ? paidForPrice : paidForPrice.toUSDC())
          .add(
            orderItem.mods.reduce((acc, mod) => {
              const modPrice = mod.discountPrice ?? mod.price;
              return acc.add(isUSDC(modPrice) ? modPrice : modPrice.toUSDC());
            }, USDC.ZERO),
          );
      }, USDC.ZERO);

  const total_withTip = total_noTip.add(order.tip?.amount ?? USDC.ZERO);

  return {
    /**
     * @dev subTotal is the total without the tip
     */
    subTotal: {
      formatted: total_noTip.prettyFormat(),
      usdc: total_noTip,
    },
    tip: order.tip
      ? {
          formatted: order.tip.amount.prettyFormat(),
          usdc: order.tip.amount,
        }
      : null,
    /**
     * @dev total is the subtotal + tip
     */
    total: {
      formatted: total_withTip.prettyFormat(),
      usdc: total_withTip,
    },
  };
};

export const mapStatusToStatusLabel = (status: Order['status']) => {
  switch (status) {
    case '1-pending':
    case '2-submitting':
      return 'Pending';
    case '3-in-progress':
      return 'In Progress';
    case '4-complete':
      return 'Complete';
    case 'cancelled':
      return 'Cancelled';
  }
};

export const isPending = (o: Order): o is Cart => o.status === '1-pending';

export const isInProgress = (o: Order) => o.status === '3-in-progress';

export const isComplete = (o: Order) => o.status === '4-complete';

export const isPaidOrder = (o: Order): o is PaidOrder =>
  o.status !== '1-pending';

export const hasPaymentConfirmed = (o: Order) =>
  o.status === '3-in-progress' || o.status === '4-complete';
