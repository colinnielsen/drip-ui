import { prettyFormatPrice } from '@/lib/utils';
import { DRIP_TIP_ITEM_NAME, Order, OrderItem } from './OrderType';

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

export const getOrderSummary = (o: Order) => {
  const total_noTip = o.orderItems.reduce(
    (acc, orderItem) =>
      isDripTip(orderItem)
        ? acc
        : acc +
          BigInt(orderItem.item.price) +
          orderItem.mods.reduce((acc, mod) => acc + BigInt(mod.price), 0n),
    0n,
  );

  const dripTip = o.orderItems.find(isDripTip);
  const total_withTip = dripTip
    ? total_noTip + BigInt(dripTip.item.price)
    : total_noTip;

  return {
    subTotal: {
      formatted: prettyFormatPrice(total_noTip, 6, true),
      raw: total_noTip,
    },
    tip: dripTip
      ? {
          formatted: prettyFormatPrice(BigInt(dripTip.item.price), 6, true),
          raw: BigInt(dripTip.item.price),
        }
      : null,
    total: {
      formatted: prettyFormatPrice(total_withTip, 6, true),
      raw: total_withTip,
    },
  };
};

export const isDripTip = (o: OrderItem) => o.item.name === DRIP_TIP_ITEM_NAME;

export const isPending = (o: Order) => o.status === 'pending';

export const isInProgress = (o: Order) => o.status === 'in-progress';

export const isComplete = (o: Order) => o.status === 'complete';
