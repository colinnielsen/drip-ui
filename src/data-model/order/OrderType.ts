import { UUID } from 'crypto';
import { Item, ItemMod } from '../item/ItemType';
import { Address, Hex } from 'viem';
import { USDC } from '../_common/currency/USDC';
import { Currency } from '../_common/type/CommonType';

export type OrderItem = {
  id: UUID;
  item: Item;
  //quoted price?
  paidPrice?: Currency;
  mods: ItemMod[];
};

export type SliceOrderInfo = {
  __type: 'slice';
  orderId: string;
  orderNumber?: string;
  status?: OrderStatus;
};

export type ExternalOrderInfo = SliceOrderInfo;

export type OrderSummary = {
  subTotal: {
    formatted: string;
    usdc: USDC;
  };
  tip: {
    formatted: string;
    usdc: USDC;
  } | null;
  total: {
    formatted: string;
    usdc: USDC;
  };
};

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
    amount: USDC;
    address: Address;
  } | null;
};

export type Cart = _BaseOrder & {
  /**
   * - 1-pending: the order has not been paid for
   */
  status: '1-pending';
};

export type PaidOrder = _BaseOrder & {
  /**
   * - 2-submitting: the order has been paid for and the tx is yet to confirm
   * - 3-in-progress: the order has been paid for and the tx has been confirmed (the external service has received the order)
   * - 4-complete: the order has been processed
   */
  status: '2-submitting' | '3-in-progress' | '4-complete';
  transactionHash: Hex;
  externalOrderInfo?: ExternalOrderInfo;
};

export type CancelledOrder = Omit<PaidOrder, 'status'> & {
  status: 'cancelled';
};

export type Order = Cart | PaidOrder | CancelledOrder;

export type OrderStatus = Order['status'];
