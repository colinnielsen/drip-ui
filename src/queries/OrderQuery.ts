import { Unsaved } from '@/data-model/_common/type/CommonType';
import { mapCartToSliceCart } from '@/data-model/_common/type/SliceDTO';
import {
  ExternalOrderInfo,
  Order,
  OrderItem,
} from '@/data-model/order/OrderType';
import { getSlicerIdFromSliceStoreId } from '@/data-model/shop/ShopDTO';
import { axiosFetcher, err } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UUID } from 'crypto';
import { Address, Hash } from 'viem';
import { useFarmer } from './FarmerQuery';
import { useShop } from './ShopQuery';
import { useSliceStoreProducts } from './SliceQuery';
import { useActiveUser, useUserId } from './UserQuery';

//
//// QUERIES
//
const CART_QUERY_KEY = 'cart';
export const ORDERS_QUERY_KEY = 'orders';

function orderQuery<T = Order[]>(
  userId: string | undefined,
  select?: (orders: Order[]) => T,
) {
  return {
    queryKey: [ORDERS_QUERY_KEY, userId],
    queryFn: async () => axiosFetcher<Order[]>(`/api/orders/order`),
    select,
    enabled: !!userId,
  };
}

export const useOrders = () => {
  const { data: userId } = useUserId();

  return useQuery(orderQuery(userId));
};

export const useCart = () => {
  const { data: userId } = useUserId();

  return useQuery(
    orderQuery(
      userId,
      orders => orders.find(o => o.status !== 'pending') ?? null,
    ),
  );
};

export const useCartId = () => {
  const { data: cart } = useCart();
  return cart?.id;
};

/**
 * @dev the user's current cart, mapped to a usable slicekit cart
 */
export const useCartInSliceFormat = ({
  buyerAddress: _buyer,
}: {
  buyerAddress?: Address | null | undefined;
}) => {
  const buyerAddress = _buyer ?? undefined;
  const { data: cart } = useCart();
  const { data: shop } = useShop(cart?.shop);

  const slicerId =
    shop?.__sourceConfig.type === 'slice'
      ? getSlicerIdFromSliceStoreId(shop?.__sourceConfig.id)
      : undefined;

  return useSliceStoreProducts({
    slicerId,
    buyer: buyerAddress,
    select: cartProducts => {
      return !cart ? [] : mapCartToSliceCart(cart, cartProducts);
    },
  });
};

// export const useSlicePrices = () => {
//   const { data: cart } = useCart();
//   const buyer = useConnectWallet();
//   const { data: shop } = useShop(cart?.shop);
//   const {
//     checkout,
//     balances,
//     cart: test,
//     prices,
//   } = useCheckout(privyWagmiConfig, {
//     buyer,
//   });

//   return useQuery({
//     queryKey: [CART_QUERY_KEY, 'slice'],
//   });
// };

// export const usePrivyCheckout =

//
//// MUTATIONS
//
export const useAddToCart = ({
  shopId,
  orderId,
  orderItem,
}: {
  shopId: UUID;
  orderId?: UUID;
  orderItem: Unsaved<OrderItem> | Unsaved<OrderItem>[];
}) => {
  const queryClient = useQueryClient();
  const itemArray = Array.isArray(orderItem) ? orderItem : [orderItem];

  return useMutation({
    mutationFn: async () =>
      axiosFetcher<Order>(
        `/api/orders/order${orderId ? `?orderId=${orderId}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: { action: 'add', shopId, orderItems: itemArray },
          withCredentials: true,
        },
      ),
    onSuccess: data => {
      if (!data) debugger;
      return queryClient.setQueryData(
        [ORDERS_QUERY_KEY, data.user],
        (orders: Order[]) => orders.map(o => (o.id === data.id ? data : o)),
      );
    },
  });
};

export const useRemoveItemFromCart = ({
  orderItemId,
  orderId,
  shopId,
}: {
  orderItemId: UUID;
  orderId: UUID;
  shopId: UUID;
}) => {
  const queryClient = useQueryClient();
  const { data: userId } = useUserId();

  return useMutation({
    mutationFn: async () =>
      axiosFetcher<Order | null>(`/api/orders/order?orderId=${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: { action: 'delete', orderItemId, shopId },
        withCredentials: true,
      }),
    onSuccess: data => {
      return queryClient.setQueryData(
        [ORDERS_QUERY_KEY, userId, CART_QUERY_KEY],
        (orders: Order[]) =>
          !data
            ? orders.filter(o => o.id !== orderId)
            : orders.map(o => (o.id === data.id ? data : o)),
      );
    },
  });
};

export const useFarmerAllocationFromOrder = (order: Order) => {
  const { data: shop } = useShop(order.shop);
  const allocation = shop?.farmerAllocations[0];

  const { data: farmer } = useFarmer(allocation?.farmer);

  if (!farmer || !allocation) return null;
  return {
    farmer,
    allocation,
  };
};

export const useAssocatePaymentToCart = () => {
  const queryClient = useQueryClient();

  const { data: cart } = useCart();

  return useMutation({
    mutationFn: async (transactionHash: Hash) => {
      return axiosFetcher<Order>(`/api/orders/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          transactionHash,
          orderId: cart?.id || err('No cart in useAssocatePaymentToCart'),
        },
        withCredentials: true,
      });
    },
    onSuccess: data => {
      return queryClient.setQueryData(
        [ORDERS_QUERY_KEY, data.user ?? err('expected userId')],
        (orders: Order[]) => orders.map(o => (o.id === data.id ? data : o)),
      );
    },
  });
};

export const useAssocateExternalOrderInfoToCart = () => {
  const queryClient = useQueryClient();

  const { data: cart } = useCart();

  return useMutation({
    mutationFn: async (externalOrderInfo: ExternalOrderInfo) => {
      return axiosFetcher<Order>(`/api/orders/add-external-order-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          externalOrderInfo,
          orderId:
            cart?.id || err('No cart in useAssocateExternalOrderInfoToCart'),
        },
        withCredentials: true,
      });
    },
    onSuccess: data => {
      return queryClient.setQueryData(
        [ORDERS_QUERY_KEY, data.user ?? err('expected userId')],
        (orders: Order[]) => orders.map(o => (o.id === data.id ? data : o)),
      );
    },
  });
};

export const useCheckOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: UUID) =>
      axiosFetcher<Order>(`/api/orders/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: { orderId },
      }),
    onSuccess: data =>
      queryClient.setQueryData(
        [ORDERS_QUERY_KEY, data.user],
        (orders: Order[]) => orders.map(o => (o.id === data.id ? data : o)),
      ),
  });
};
