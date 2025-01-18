import { UUID } from '@/data-model/_common/type/CommonType';
import { mapCartToSliceCart } from '@/data-model/_external/data-sources/slice/SliceDTO';
import { ExternalOrderInfo, Order } from '@/data-model/order/OrderType';
import { getSlicerIdFromSliceExternalId } from '@/data-model/shop/ShopDTO';
import { axiosFetcher, err, sortDateAsc, uniqBy } from '@/lib/utils';
import { PayRequest } from '@/pages/api/orders/pay';
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Address, Hash } from 'viem';
import { useFarmer } from './FarmerQuery';
import { useShop, useShopPriceDictionary } from './ShopQuery';
import { useSliceStoreProducts } from './SliceQuery';
import { useUserId } from './UserQuery';

//
//// HELPERS
//

export const updateOrderInPlace = (queryClient: QueryClient, order: Order) => {
  queryClient.setQueryData([ORDERS_QUERY_KEY, order.user], (prev: Order[]) =>
    prev.map(o => (o.id === order.id ? order : o)),
  );
};

export const removeOrder = (queryClient: QueryClient, order: Order) => {
  queryClient.setQueryData([ORDERS_QUERY_KEY, order.user], (prev: Order[]) =>
    prev.filter(o => o.id !== order.id),
  );
};

export const rollbackOrderUpdate = (
  queryClient: QueryClient,
  prevOrder: Order,
) => {
  queryClient.setQueryData(
    [ORDERS_QUERY_KEY, prevOrder.user],
    (prev: Order[]) => prev.map(o => (o.id === prevOrder.id ? prevOrder : o)),
  );
};

//
//// QUERIES
//

export const ORDERS_QUERY_KEY = 'orders';

function orderQuery<T = Order[]>(
  userId: string | undefined,
  select?: (orders: Order[]) => T,
) {
  return {
    queryKey: [ORDERS_QUERY_KEY, userId],
    queryFn: async () => await axiosFetcher<Order[]>(`/api/orders/order`),
    select: (orders: Order[]) => {
      const sorted = orders.sort((a, b) =>
        sortDateAsc(a.timestamp, b.timestamp),
      );
      if (select) return select(sorted) as T;
      return sorted as T;
    },
    enabled: !!userId,
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
      orders.filter(
        o => o.status === '3-in-progress' || o.status === '2-submitting',
      ),
    ),
  );
};

const cartSelector = (orders: Order[]) =>
  orders
    .sort((a, b) => sortDateAsc(a.timestamp, b.timestamp))
    .find(
      o =>
        (o.status !== '4-complete' &&
          o.status !== 'cancelled' &&
          new Date(o.timestamp).getTime() > Date.now() - 4 * 60 * 60 * 1000) ||
        (o.status === '4-complete' &&
          new Date(o.timestamp).getTime() > Date.now() - 10 * 60 * 1000),
    ) ?? null;

export const useRecentCart = () => {
  const { data: userId } = useUserId();
  return useQuery({
    ...orderQuery(userId, cartSelector),
  });
};

// export const useCartSummary = () => {
//   const { data: cart } = useRecentCart();
//   const { data: shop } = useShop({ id: cart?.shop });
//   const allShopItems = useMemo(
//     () =>
//       Object.values(shop?.menu ?? {})
//         .flat()
//         .sort((a, b) => a.id.localeCompare(b.id))
//         .reduce<Record<UUID, Item>>((acc, item) => {
//           acc[item.id] = item;
//           return acc;
//         }, {}),
//     [shop?.menu],
//   );

//   const cartSummary = useMemo(() => {
//     if (!cart) return null;
//     const cartWithDiscountPrices: Order = {
//       ...cart,
//       lineItems: cart.lineItems.map(o => ({
//         ...o,
//         item: {
//           ...o.item,
//           discountPrice: allShopItems[o.item.id]?.discountPrice,
//         },
//       })),
//     };
//     return getOrderSummary(cartWithDiscountPrices);
//   }, [cart, allShopItems]);

//   return cartSummary;
// };

export const useCartId = () => {
  const { data: cart } = useRecentCart();
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
  const { data: cart } = useRecentCart();
  const { data: shop } = useShop({ id: cart?.shop });

  const slicerId =
    shop?.__sourceConfig.type === 'slice'
      ? getSlicerIdFromSliceExternalId(shop.__sourceConfig.id)
      : undefined;

  return useSliceStoreProducts({
    slicerId,
    buyer: buyerAddress,
    select: cartProducts => {
      return !cart ? [] : mapCartToSliceCart(cart, cartProducts);
    },
  });
};

//
//// MUTATIONS
//

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
  const { data: cart } = useRecentCart();

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
      if (!cart || cart.status !== '1-pending') throw Error('cart not pending');
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
    onSettled: variable => {
      queryClient.refetchQueries({
        queryKey: [ORDERS_QUERY_KEY, variable?.id!],
      });
    },
    // onSuccess: (result, _vars, { optimisticCart }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [ORDERS_QUERY_KEY, userId!],
    //   });
    //   // // if the item is removed we're successful
    //   // if (!result || !optimisticCart) return;

    //   // // otherwise sync the orders with the result by replacing the optimistic cart with the result from the backend
    //   // return queryClient.setQueryData(
    //   //   [ORDERS_QUERY_KEY, userId],
    //   //   (prev: Order[]) =>
    //   //     prev.map(o => (o.id === optimisticCart.id ? result : o)),
    //   // );
    // },
    // onError: (_error, _variables, context) => {
    //   if (!context) return;
    //   queryClient.invalidateQueries({
    //     queryKey: [ORDERS_QUERY_KEY, userId!],
    //   });
    // queryClient.setQueryData([ORDERS_QUERY_KEY, userId], (old: Order[]) => {
    //   const wasDeleteOperation = context.optimisticCart === null;
    //   // put the cart back if it was deleted
    //   if (wasDeleteOperation) return [context.prevCart, ..._.cloneDeep(old)];
    //   // otherwise, put the prev cart back in place
    //   return old.map(o =>
    //     o.id === context.optimisticCart!.id ? context.prevCart : o,
    //   );
    // });
    // },
  });
};

export const useFarmerAllocation = ({ shopId }: { shopId: UUID }) => {
  const { data: shop } = useShop({ id: shopId });
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

  const { data: cart } = useRecentCart();
  const { data: priceDict } = useShopPriceDictionary(cart?.shop!);

  return useMutation({
    scope: { id: 'cart' },
    mutationFn: async (transactionHash: Hash) => {
      if (!cart || !priceDict) throw Error('No cart or price dict');
      return axiosFetcher<Order, PayRequest>(`/api/orders/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          type: 'slice',
          transactionHash,
          orderId: cart.id,
        },
        withCredentials: true,
      });
    },
    onSettled: variable => {
      queryClient.refetchQueries({
        queryKey: [ORDERS_QUERY_KEY, variable?.id!],
      });
    },
    // onSuccess: data => {
    // return queryClient.setQueryData(
    //   [ORDERS_QUERY_KEY, data.user ?? err('expected userId')],
    //   (orders: Order[]) => orders.map(o => (o.id === data.id ? data : o)),
    // );
    // },
    retry: 3,
  });
};

export const useAssocateExternalOrderInfoToCart = () => {
  const queryClient = useQueryClient();

  const { data: cart } = useRecentCart();

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
    onSettled: variable => {
      queryClient.refetchQueries({
        queryKey: [ORDERS_QUERY_KEY, variable?.id!],
      });
    },
    // onSuccess: data => {
    //   return queryClient.setQueryData(
    //     [ORDERS_QUERY_KEY, data.user ?? err('expected userId')],
    //     (orders: Order[]) => orders.map(o => (o.id === data.id ? data : o)),
    //   );
    // },
    retry: 3,
  });
};

export const usePollExternalServiceForOrderCompletion = (
  incompleteOrders: Order[],
) => {
  const pendingOrders = incompleteOrders.filter(o => o.status !== '4-complete');
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
        const remainingInProgress = result.filter(
          o => o.status !== '4-complete',
        );
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
    refetchInterval: 8_000,
    enabled: pendingOrders.length > 0,
  });
};
