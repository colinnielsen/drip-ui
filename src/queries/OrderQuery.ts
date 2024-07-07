import { OrderItem } from "@/data-model/order/OrderType";
import { database } from "@/infras/database";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UUID } from "crypto";

//
//// QUERIES
//
export const useActiveOrders = (userId: UUID) =>
  useQuery({
    queryKey: ["activeOrder"],
    queryFn: async () => await database.order.getActiveUserOrders(userId),
  });

//
//// MUTATIONS
//
export const useSaveOrder = (
  cafeId: UUID,
  userId: UUID,
  orderItems: OrderItem[]
) =>
  useMutation({
    mutationFn: async () =>
      await database.order.save(cafeId, userId, orderItems),
  });

export const useAddOrderItem = (orderId: UUID, item: OrderItem) =>
  useMutation({
    mutationFn: async () =>
      await database.order.update(orderId, [{ __type: "add", item }]),
  });

export const useDeleteOrderItem = (orderId: UUID, itemId: UUID) =>
  useMutation({
    mutationFn: async () =>
      await database.order.update(orderId, [{ __type: "delete", itemId }]),
  });
