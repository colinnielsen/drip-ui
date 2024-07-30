import { UUID } from 'crypto';
import { Item, ItemMod } from '../item/ItemType';
import { Address, Hex } from 'viem';

export const DRIP_TIP_ITEM_NAME = '__drip-tip';

export type OrderItem = {
  id: UUID;
  item: Item;
  mods: ItemMod[];
};

export type SliceOrderInfo = {
  __type: 'slice';
  orderId: string;
};

export type ExternalOrderInfo = SliceOrderInfo;

type _BaseOrder = {
  id: UUID;
  timestamp: string;
  /** The id of the shop */
  shop: UUID;
  /** Id of the user who created the order */
  user: UUID;
  /** The items the user ordered */
  orderItems: OrderItem[];
  tip: {
    amount: number;
    address: Address;
  } | null;
};

export type Cart = _BaseOrder & {
  /**
   * pending: the order has not been paid for
   */
  status: 'pending';
};

export type PaidOrder = _BaseOrder & {
  /**
   * submitting: the order has been paid for and the tx is yet to confirm
   * in-progress: the order has been paid for and the tx has been confirmed - the shop has received the order
   * complete: the order has been processed
   */
  status: 'submitting' | 'in-progress' | 'complete';
  transactionHash: Hex;
  externalOrderInfo?: ExternalOrderInfo;
};

export type Order = Cart | PaidOrder;

export type OrderStatus = Order['status'];
