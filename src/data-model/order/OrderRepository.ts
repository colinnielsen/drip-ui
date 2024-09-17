import { UUID } from 'crypto';
import { Order, OrderItem } from './OrderType';
import { Currency, Unsaved } from '../_common/type/CommonType';
import { Hash } from 'viem';
import { USDC } from '../_common/currency/USDC';

export type UpdateOrderOperation =
  | { __type: 'add'; orderItem: Unsaved<OrderItem> | Unsaved<OrderItem>[] }
  | { __type: 'tip'; tip: ({ amount: USDC } & Partial<Order['tip']>) | null }
  | { __type: 'delete'; orderItemId: UUID }
  | { __type: 'update'; orderItemId: UUID; orderItem: OrderItem };

export type OrderRepository = {
  findById: (orderId: UUID) => Promise<Order | null>;
  /**
   * @dev creates a new order
   */
  save: (shopId: UUID, userId: UUID, items: OrderItem[]) => Promise<Order>;
  /**
   * @dev updates an order with the operations
   */
  update: (
    orderId: UUID,
    operations: UpdateOrderOperation[],
  ) => Promise<Order | null>;
  /**
   * @dev associates a payment to an order
   */
  pay: (
    orderId: UUID,
    transactionHash: Hash,
    paidPrices: Record<UUID, Currency>,
  ) => Promise<Order>;
  /**
   * @dev deletes an order
   * @throws if order is not `pending`
   */
  delete: (orderId: UUID) => Promise<void>;
  /**
   * removes the items from the order
   */
  clear: (orderId: UUID) => Promise<Order>;
  /**
   * @dev finds users orders
   */
  getOrdersByUserId: (userId: UUID) => Promise<Order[]>;
  /**
   * @dev find a users order
   */
  getRecentUserOrder: (userId: UUID) => Promise<Order | null>;
  /**
   * @dev migrates all orders to a new user
   */
  migrate: ({
    prevUserId,
    newUserId,
  }: {
    prevUserId: UUID;
    newUserId: UUID;
  }) => Promise<Order[]>;
};
