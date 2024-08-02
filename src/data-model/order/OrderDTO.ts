import { err } from '@/lib/utils';
import { isUSDC, USDC } from '../_common/currency/USDC';
import { Shop } from '../shop/ShopType';
import {
  Cart,
  ExternalOrderInfo,
  Order,
  OrderItem,
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

export const getCostSummary = (o: Order) => {
  const total_noTip: USDC = o.orderItems.reduce<USDC>(
    (acc, orderItem) =>
      acc
        .add(
          isUSDC(orderItem.item.price)
            ? orderItem.item.price
            : orderItem.item.price.toUSDC(),
        )
        .add(
          orderItem.mods.reduce(
            (acc, mod) =>
              acc.add(isUSDC(mod.price) ? mod.price : mod.price.toUSDC()),
            USDC.ZERO,
          ),
        ),
    USDC.ZERO,
  );

  const total_withTip = total_noTip.add(o.tip?.amount ?? USDC.ZERO);

  return {
    /**
     * @dev subTotal is the total without the tip
     */
    subTotal: {
      formatted: total_noTip.prettyFormat(),
      usdc: total_noTip,
    },
    tip: o.tip
      ? {
          formatted: o.tip.amount.prettyFormat(),
          usdc: o.tip.amount,
        }
      : null,
    /**
     * @dev total is the subtotal + tip
     */
    total: {
      formatted: total_withTip.prettyFormat(),
      raw: total_withTip,
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
