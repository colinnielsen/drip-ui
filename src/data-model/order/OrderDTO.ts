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

export const getTotalItemCostBasedOnModSelection = (
  orderItem: Unsaved<OrderItem>,
) => {
  return {
    price: orderItem.mods.reduce<Currency>(
      (acc, mod) => addCurrencies(acc, mod.price),
      orderItem.item.price,
    ),
    discountPrice: orderItem.mods.reduce<Currency>(
      (acc, mod) => addCurrencies(acc, mod.discountPrice ?? mod.price),
      orderItem.item.discountPrice ?? orderItem.item.price,
    ),
  };
};

export const getOrderSummary = (
  orderItems: OrderItem[],
  tip: Order['tip'],
): OrderSummary => {
  const total_noTip: USDC = orderItems.reduce<USDC>((acc, orderItem) => {
    const paidForPrice = orderItem.item.discountPrice ?? orderItem.item.price;
    return acc
      .add(isUSDC(paidForPrice) ? paidForPrice : paidForPrice.toUSDC())
      .add(
        orderItem.mods.reduce((acc, mod) => {
          const modPrice = mod.discountPrice ?? mod.price;
          return acc.add(isUSDC(modPrice) ? modPrice : modPrice.toUSDC());
        }, USDC.ZERO),
      );
  }, USDC.ZERO);

  const total_withTip = total_noTip.add(tip?.amount ?? USDC.ZERO);

  return {
    /**
     * @dev subTotal is the total without the tip
     */
    subTotal: {
      formatted: total_noTip.prettyFormat(),
      usdc: total_noTip,
    },
    tip: tip
      ? {
          formatted: tip.amount.prettyFormat(),
          usdc: tip.amount,
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
    case 'pending':
    case 'submitting':
      return 'Pending';
    case 'in-progress':
      return 'In Progress';
    case 'complete':
      return 'Complete';
    case 'cancelled':
      return 'Cancelled';
  }
};

export const isPending = (o: Order): o is Cart => o.status === 'pending';

export const isInProgress = (o: Order) => o.status === 'in-progress';

export const isComplete = (o: Order) => o.status === 'complete';

export const isPaidOrder = (o: Order): o is PaidOrder => o.status !== 'pending';

export const hasPaymentConfirmed = (o: Order) =>
  o.status === 'in-progress' || o.status === 'complete';
