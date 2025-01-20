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
import { useShop } from './ShopQuery';
import { useSliceStoreProducts } from './SliceQuery';
import { useUserId } from './UserQuery';
import { needsSyncing } from '@/data-model/order/OrderDTO';
import { useCart } from './CartQuery';
import { LineItem } from '@/data-model/order/LineItemAggregate';
import { Cart } from '@/data-model/cart/CartType';

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
        o => o.status === '1-submitting' || o.status === '2-in-progress',
      ),
    ),
  );
};

const recentOrderSelector = (orders: Order[]) =>
  orders
    .sort((a, b) => sortDateAsc(a.timestamp, b.timestamp))
    .find(
      o =>
        (o.status !== '3-complete' &&
          o.status !== 'cancelled' &&
          +new Date(o.timestamp) > Date.now() - 10 * 60 * 1000) ||
        (o.status === '3-complete' &&
          +new Date(o.timestamp) > Date.now() - 60 * 60 * 1000),
    ) ?? null;

/**
 * @returns a recently placed order:
 * - either the most recent pending order within 10 minutes
 * - or your last complete order from within 1 hour
 */
export const useRecentOrder = () => {
  const { data: userId } = useUserId();
  return useQuery({
    ...orderQuery(userId, recentOrderSelector),
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
  const { data: cart } = useRecentOrder();
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
  const { data: cart } = useRecentOrder();
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
  lineItemUniqueId,
  orderId,
  shopId,
}: {
  lineItemUniqueId: LineItem['uniqueId'];
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
        data: { action: 'delete', lineItemUniqueId, shopId },
        withCredentials: true,
      }),
    onMutate() {
      if (!cart) return null;

      const willEraseCart =
        cart.lineItems.length === 1 &&
        cart.lineItems[0].uniqueId === lineItemUniqueId &&
        cart.lineItems[0].quantity === 1;

      const willRemoveLineItem =
        cart.lineItems.find(li => li.uniqueId === lineItemUniqueId)!
          .quantity === 1;

      const optimisticCart: Cart | null = willEraseCart
        ? null
        : {
            ...cart,
            lineItems: willRemoveLineItem
              ? // if this operation will remove the line item, then filter out the item with the matching id
                cart.lineItems.filter(o => o.uniqueId !== lineItemUniqueId)
              : // otherwise, just decrement the line item
                cart.lineItems.map<LineItem>(li =>
                  li.uniqueId !== lineItemUniqueId
                    ? li
                    : { ...li, quantity: li.quantity - 1 },
                ),
          };

      setCart;

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

  const { data: cart } = useRecentOrder();
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

  const { data: cart } = useRecentOrder();

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
  const ordersToSync = incompleteOrders.filter(needsSyncing);
  const queryClient = useQueryClient();
  const { data: userId } = useUserId();

  return useQuery({
    queryKey: [
      ORDERS_QUERY_KEY,
      ...ordersToSync.map(o => o.id),
      'status-check',
    ],
    queryFn: async () =>
      axiosFetcher<Order[]>(`/api/orders/sync-with-external-service`, {
        method: 'POST',
        data: { orderIds: ordersToSync.map(o => o.id) },
      }).then(result => {
        const remainingToBeSynced = result.filter(needsSyncing);

        queryClient.setQueryData(
          [ORDERS_QUERY_KEY, userId],
          (oldOrders: Order[]) => uniqBy([...oldOrders, ...result], 'id'),
        );
        if (remainingToBeSynced.length < incompleteOrders.length) {
          queryClient.refetchQueries({
            queryKey: [ORDERS_QUERY_KEY, userId],
          });
        }

        return result;
      }),
    refetchInterval: 8_000,
    enabled: ordersToSync.length > 0,
  });
};
