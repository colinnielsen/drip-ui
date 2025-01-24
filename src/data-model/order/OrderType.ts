import { UUID } from '@/data-model/_common/type/CommonType';
import { Hex } from 'viem';
import { Currency } from '../_common/currency';
import { USDC } from '../_common/currency/USDC';
import { EthAddress } from '../ethereum/EthereumType';
import { Discount } from '../discount/DiscountType';
import { LineItem } from './LineItemAggregate';

export type SliceOrderInfo = {
  __type: 'slice';
  orderId: string;
  orderNumber?: string;
  status?: OrderStatus;
};

export type SquareOrderInfo = {
  __type: 'square';
  orderId: string;
  orderNumber?: string;
  status?: OrderStatus;
};

/**
 * @dev Information relevant to the external service the order is created or pushed to.
 *    e.g; a slice order id, a square transaction number
 */
export type ExternalOrderInfo = SliceOrderInfo | SquareOrderInfo;

export type PaymentInfo = {
  __type: 'onchain';
  transactionHash: Hex;
  amount: Currency;
};

type FarmerDistribution = {
  __type: 'farmer-distribution';
  farmerId: UUID;
  amount: Currency;
};

export type AdditionalDistribution = FarmerDistribution;

//
//// ORDER VARIATIONS
//

export type _Order = {
  id: UUID;
  timestamp: Date;
  /** The id of the shop */
  shop: UUID;
  /** Id of the user who created the order */
  user: UUID;
  /** The items the user ordered */
  lineItems: LineItem[];
  /** all discounts applied on this order */
  discounts?: Discount[] | null;
  /** the tip amount */
  tip?: {
    amount: USDC;
    recipient: EthAddress;
  } | null;
  /** The additive price of all the line-items and their mods */
  subtotal: Currency;
  /** The amount of tax applied on the order */
  taxAmount: Currency;
  /** The total amount of discounts */
  discountAmount: Currency;
  /** The final total amount, meaning the subtotal + tip + tax - discounts */
  totalAmount: Currency;
  /**
   * - 1-submitting: the order has been paid for and the tx is yet to confirm
   * - 2-in-progress: the order has been paid for and the tx has been confirmed (the external service has received the order)
   * - 3-complete: the order has been processed (in slice, this means the order was marked as complete by the POS or timed out)
   */
  status: '1-submitting' | '2-in-progress' | '3-complete';
  payments: PaymentInfo[];
  additionalDistributions?: AdditionalDistribution[];
  externalOrderInfo?: ExternalOrderInfo;
};

export type NewOrder = Omit<_Order, 'status'> & {
  status: '1-submitting';
};

export type InProgressOrder = Omit<_Order, 'status'> & {
  status: '2-in-progress';
  payments: PaymentInfo[];
  externalOrderInfo: ExternalOrderInfo;
};

export type CancelledOrder = Omit<_Order, 'status'> & {
  status: 'cancelled';
};

export type CompletedOrder = Omit<_Order, 'status'> & {
  status: '3-complete';
};

export type ErroredOrder = Omit<_Order, 'status'> & {
  status: 'error';
  errorDetails: {
    /*
     * where the error originated from
     */
    origin: string;
    message: string;
  };
};

export type Order = _Order | NewOrder | CancelledOrder | ErroredOrder;

//
//// DERIVED TYPES
///
export type OrderStatus = Order['status'];

export type PaymentSummary = {
  subtotal: Currency | null;
  tax: Currency | null;
  discount: Currency | null;
  tip: Currency | null;
  total: Currency | null;
};
