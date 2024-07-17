import { Unsaved } from '@/data-model/_common/type/CommonType';
import { Order, OrderItem } from '@/data-model/order/OrderType';
import { axiosFetcher } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UUID } from 'crypto';
import { useActiveUser } from './UserQuery';

//
//// QUERIES
//
const CART_QUERY_KEY = 'cart';

export const useCart = () => {
  const { data: user } = useActiveUser();
  const userId = user?.id;

  return useQuery({
    queryKey: [CART_QUERY_KEY, userId],
    queryFn: async () =>
      axiosFetcher<Order>(`/api/orders/cart?userId=${userId}`),
    enabled: !!userId,
  });
};

//
//// MUTATIONS
//
export const useAddToCart = ({
  shopId,
  userId,
  orderItem,
}: {
  shopId: UUID;
  userId: UUID;
  orderItem: Unsaved<OrderItem> | Unsaved<OrderItem>[];
}) => {
  const queryClient = useQueryClient();
  const itemArray = Array.isArray(orderItem) ? orderItem : [orderItem];

  return useMutation({
    mutationFn: async () =>
      axiosFetcher<Order>(`/api/orders/cart?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: { shopId, orderItems: itemArray },
        withCredentials: true,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] }),
  });
};

// export const useClearCart = (userId: UUID) => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async () => {
//       return axiosFetcher(`/api/orders/cart?userId=${userId}`, {
//         method: 'DELETE',
//         withCredentials: true,
//       });
//     },
//     onSuccess: () =>
//       queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] }),
//   });
// };
