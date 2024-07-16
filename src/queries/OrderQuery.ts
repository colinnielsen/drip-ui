import { Unsaved } from '@/data-model/_common/type/CommonType';
import { OrderItem } from '@/data-model/order/OrderType';
import { database } from '@/infras/database';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UUID } from 'crypto';

//
//// QUERIES
//
const CART_QUERY_KEY = 'cart';

export const useCart = (userId: UUID) =>
  useQuery({
    queryKey: [CART_QUERY_KEY],
    queryFn: async () =>
      (await database.order.getActiveUserOrder(userId)) ?? undefined,
  });

//
//// MUTATIONS
//
export const useSaveOrder = (
  shopId: UUID,
  userId: UUID,
  orderItems: OrderItem[],
) =>
  useMutation({
    mutationFn: async () =>
      await database.order.save(shopId, userId, orderItems),
  });

export const useAddToCart = ({
  shopId,
  userId,
  orderId,
  orderItem,
}: {
  shopId: UUID;
  userId: UUID;
  orderId?: UUID;
  orderItem: Unsaved<OrderItem> | Unsaved<OrderItem>[];
}) => {
  const queryClient = useQueryClient();
  const itemArray = Array.isArray(orderItem) ? orderItem : [orderItem];
  return useMutation({
    mutationFn: async () => {
      debugger;
      // if there's no order, create one
      if (!orderId) return await database.order.save(shopId, userId, itemArray);
      // otherwise add it to an existing order
      else
        return await database.order.update(orderId, [
          { __type: 'add', item: itemArray },
        ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [CART_QUERY_KEY],
      });
    },
  });
};

export const useDeleteOrderItem = (orderId: UUID, itemId: UUID) =>
  useMutation({
    mutationFn: async () =>
      await database.order.update(orderId, [{ __type: 'delete', itemId }]),
  });
