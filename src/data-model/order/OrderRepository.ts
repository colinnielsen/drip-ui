import { UUID } from "crypto";
import { Order, OrderItem } from "./OrderType";

export type UpdateOrderOperation =
  | { __type: "add"; item: OrderItem }
  | { __type: "delete"; itemId: UUID }
  | { __type: "update"; itemId: UUID; item: OrderItem };

export type OrderRepository = {
  findById: (orderId: UUID) => Promise<Order | null>;
  /**
   * @dev creates a new order
   */
  save: (cafeId: UUID, userId: UUID, items: OrderItem[]) => Promise<Order>;
  /**
   * @dev updates an order with the operations
   * @throws if order is
   */
  update: (orderId: UUID, operations: UpdateOrderOperation[]) => Promise<Order>;
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
   * @dev finds users orders
   */
  getActiveUserOrders: (userId: UUID) => Promise<Order[]>;
};
