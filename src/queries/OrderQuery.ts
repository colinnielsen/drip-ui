import { Unsaved } from '@/data-model/_common/type/CommonType';
import { mapCartToSliceCart } from '@/data-model/_common/type/SliceDTO';
import {
  Cart,
  ExternalOrderInfo,
  Order,
  OrderItem,
} from '@/data-model/order/OrderType';
import { getSlicerIdFromSliceStoreId } from '@/data-model/shop/ShopDTO';
import {
  axiosFetcher,
  err,
  generateUUID,
  sortDateAsc,
  uniqBy,
} from '@/lib/utils';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { UUID } from 'crypto';
import { Address, Hash } from 'viem';
import { useFarmer } from './FarmerQuery';
import { useShop } from './ShopQuery';
import { useSliceStoreProducts } from './SliceQuery';
import { useUser, useUserId } from './UserQuery';

//
//// QUERIES
//
// const CART_QUERY_KEY = 'cart';
export const ORDERS_QUERY_KEY = 'orders';

function orderQuery<T = Order[]>(
  userId: string | undefined,
  select?: (orders: Order[]) => T,
) {
  return {
    queryKey: [ORDERS_QUERY_KEY, userId],
    queryFn: async () =>
      (await axiosFetcher<Order[]>(`/api/orders/order`)).sort((a, b) =>
        sortDateAsc(a.timestamp, b.timestamp),
      ),
    select,
    enabled: !!userId,
    placeholderData: keepPreviousData,
  };
}

export const useOrders = () => {
  const { data: userId } = useUserId();

  return useQuery(orderQuery(userId));
};

export const useIncompleteOrders = () => {
  const { data: userId } = useUserId();

  return useQuery(
    orderQuery(userId, orders =>
      orders.filter(o => o.status === 'in-progress'),
    ),
  );
};

const cartSelector = (orders: Order[]) =>
  orders
    .sort((a, b) => sortDateAsc(a.timestamp, b.timestamp))
    .find(o => o.status !== 'complete' && o.status !== 'cancelled') ?? null;

export const useCart = () => {
  const { data: userId } = useUserId();

  return useQuery({
    ...orderQuery(userId, cartSelector),
  });
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
  const { data: userId } = useUserId();
  const { data: cart } = useCart();
  const itemArray = Array.isArray(orderItem) ? orderItem : [orderItem];

  return useMutation({
    scope: { id: 'cart' },
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
    onMutate() {
      const optimisticCart: Cart = {
        id: cart?.id || generateUUID(),
        orderItems: [
          ...(cart?.orderItems || []),
          ...itemArray.map(i => ({ id: generateUUID(), ...i })),
        ],
        user: userId!,
        shop: shopId,
        status: 'pending',
        timestamp: cart?.timestamp || new Date().toISOString(),
        tip: cart?.tip || null,
      };

      queryClient.setQueryData([ORDERS_QUERY_KEY, userId!], (prev: Order[]) => {
        // replace the cart if it already exists
        if (!!cart)
          return prev.map(o =>
            o.id === optimisticCart.id ? optimisticCart : o,
          );
        // otherwise, unshift the cart on the front of the array
        return [optimisticCart, ...prev];
      });

      return { optimisticCart, initialCart: cart };
    },
    onSuccess: (data, _) => {
      if (!data) debugger;
      return queryClient.setQueryData(
        [ORDERS_QUERY_KEY, userId!],
        (prev: Order[]) => [data, ...prev.slice(1)],
      );
    },
    onError: (_error, _, context) => {
      queryClient.setQueryData([ORDERS_QUERY_KEY, userId!], (prev: Order[]) => {
        if (context && context.initialCart)
          return [context.initialCart, ...prev.slice(1)];
        return prev.slice(1);
      });
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
  const { data: cart } = useCart();

  return useMutation({
    scope: { id: 'cart' },
    mutationFn: async () =>
      axiosFetcher<Order | null>(`/api/orders/order?orderId=${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: { action: 'delete', orderItemId, shopId },
        withCredentials: true,
      }),
    onMutate() {
      if (!cart || cart.status !== 'pending') throw Error('cart not pending');
      const willEraseCart =
        cart?.orderItems.length === 1 && cart.orderItems[0].id === orderItemId;

      const optimisticCart: Cart | null = willEraseCart
        ? null
        : {
            ...cart,
            orderItems: cart.orderItems.filter(o => o.id !== orderItemId),
          };

      queryClient.setQueryData([ORDERS_QUERY_KEY, userId!], (prev: Order[]) => {
        if (willEraseCart || !optimisticCart)
          return prev.filter(o => o.id !== cart.id);
        return prev.map(o => (o.id === optimisticCart.id ? optimisticCart : o));
      });

      return { optimisticCart, prevCart: cart };
    },
    onSuccess: (result, _vars, { optimisticCart }) => {
      // if the item is removed we're successful
      if (!result || !optimisticCart) return;

      // otherwise sync the orders with the result by replacing the optimistic cart with the result from the backend
      return queryClient.setQueryData(
        [ORDERS_QUERY_KEY, userId],
        (prev: Order[]) =>
          prev.map(o => (o.id === optimisticCart.id ? result : o)),
      );
    },
    onError: (_error, _variables, context) => {
      if (!context) return;

      queryClient.setQueryData([ORDERS_QUERY_KEY, userId], (old: Order[]) => {
        const wasDeleteOperation = context.optimisticCart === null;
        // put the cart back if it was deleted
        if (wasDeleteOperation) return [context.prevCart, ...old];
        // otherwise, put the prev cart back in place
        return old.map(o =>
          o.id === context.optimisticCart!.id ? context.prevCart : o,
        );
      });
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
    scope: { id: 'cart' },
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
    retry: 3,
  });
};

export const useAssocateExternalOrderInfoToCart = () => {
  const queryClient = useQueryClient();

  const { data: cart } = useCart();

  return useMutation({
    scope: { id: 'cart' },
    mutationFn: async (externalOrderInfo: ExternalOrderInfo) => {
      return axiosFetcher<Order>(`/api/orders/add-external-order-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          orderId:
            cart?.id || err('No cart in useAssocateExternalOrderInfoToCart'),
          externalOrderInfo,
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
    retry: 3,
  });
};

export const usePollExternalServiceForOrderCompletion = (
  incompleteOrders: Order[],
) => {
  const pendingOrders = incompleteOrders.filter(o => o.status !== 'complete');
  const queryClient = useQueryClient();
  const { data: userId } = useUserId();

  return useQuery({
    queryKey: [
      ORDERS_QUERY_KEY,
      ...pendingOrders.map(o => o.id),
      'status-check',
    ],
    queryFn: async () =>
      axiosFetcher<Order[]>(`/api/orders/sync-with-external-service`, {
        method: 'POST',
        data: { orderIds: pendingOrders.map(o => o.id) },
      }).then(result => {
        const remainingInProgress = result.filter(o => o.status !== 'complete');
        queryClient.setQueryData(
          [ORDERS_QUERY_KEY, userId],
          (oldOrders: Order[]) => uniqBy([...oldOrders, ...result], 'id'),
        );
        if (remainingInProgress.length < incompleteOrders.length) {
          queryClient.refetchQueries({
            queryKey: [ORDERS_QUERY_KEY, userId],
          });
        }

        return result;
      }),
    refetchInterval: 10_000,
    enabled: pendingOrders.length > 0,
  });
};
