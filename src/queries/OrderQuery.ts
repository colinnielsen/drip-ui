import { Unsaved } from '@/data-model/_common/type/CommonType';
import { mapCartToSliceCart } from '@/data-model/_common/type/SliceDTO';
import { Order, OrderItem } from '@/data-model/order/OrderType';
import { axiosFetcher, never } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UUID } from 'crypto';
import { Address } from 'viem';
import { useShop } from './ShopQuery';
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

/**
 * @dev the user's current cart, mapped to a usable slicekit cart
 */
export const useCartInSliceFormat = ({
  // shop,
  buyerAddress,
}: {
  // shop: Shop;
  buyerAddress?: Address | null;
}) => {
  const { data: cart } = useCart();
  const { data: shop } = useShop(cart?.shop);

  return useQuery({
    queryKey: [CART_QUERY_KEY, 'slice'],
    queryFn: async () =>
      cart && shop && buyerAddress
        ? await mapCartToSliceCart(cart, shop, buyerAddress)
        : never('cart | shop | buyerAddress is undefined!'),
    enabled: !!cart && !!shop && !!buyerAddress,
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
        data: { action: 'add', shopId, orderItems: itemArray },
        withCredentials: true,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] }),
  });
};

export const useRemoveItemFromCart = ({
  orderItemId,
  userId,
  shopId,
}: {
  orderItemId: UUID;
  userId: UUID;
  shopId: UUID;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () =>
      axiosFetcher<Order>(`/api/orders/cart?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: { action: 'delete', orderItemId, shopId },
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
