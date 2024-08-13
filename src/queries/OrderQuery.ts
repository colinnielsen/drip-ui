import { USDC } from '@/data-model/_common/currency/USDC';
import { Unsaved } from '@/data-model/_common/type/CommonType';
import { mapCartToSliceCart } from '@/data-model/_common/type/SliceDTO';
import { Item } from '@/data-model/item/ItemType';
import {
  getOrderItemCostFromPriceDict,
  getOrderSummary,
} from '@/data-model/order/OrderDTO';
import { OrderRepository } from '@/data-model/order/OrderRepository';
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
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { UUID } from 'crypto';
import _ from 'lodash';
import { useMemo } from 'react';
import { Address, Hash, zeroAddress } from 'viem';
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
      orders.filter(o => o.status === 'in-progress'),
    ),
  );
};

const cartSelector = (orders: Order[]) =>
  orders
    .sort((a, b) => sortDateAsc(a.timestamp, b.timestamp))
    .find(
      o =>
        (o.status !== 'complete' &&
          o.status !== 'cancelled' &&
          new Date(o.timestamp).getTime() > Date.now() - 4 * 60 * 60 * 1000) ||
        (o.status === 'complete' &&
          new Date(o.timestamp).getTime() > Date.now() - 10 * 60 * 1000),
    ) ?? null;

export const useRecentCart = () => {
  const { data: userId } = useUserId();
  return useQuery({
    ...orderQuery(userId, cartSelector),
  });
};

export const useCartSummary = () => {
  const { data: cart } = useRecentCart();
  const { data: shop } = useShop({ id: cart?.shop });
  const allShopItems = useMemo(
    () =>
      Object.values(shop?.menu ?? {})
        .flat()
        .sort((a, b) => a.id.localeCompare(b.id))
        .reduce<Record<UUID, Item>>((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {}),
    [shop?.menu],
  );

  const cartSummary = useMemo(() => {
    if (!cart) return null;
    const cartWithDiscountPrices: Order = {
      ...cart,
      orderItems: cart.orderItems.map(o => ({
        ...o,
        item: {
          ...o.item,
          discountPrice: allShopItems[o.item.id]?.discountPrice,
        },
      })),
    };
    return getOrderSummary(cartWithDiscountPrices);
  }, [cart, allShopItems]);

  return cartSummary;
};

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
      ? getSlicerIdFromSliceStoreId(shop.__sourceConfig.id)
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
export const useAddToCart = ({
  shopId,
  orderItem,
}: {
  shopId: UUID;
  orderItem: Unsaved<OrderItem> | Unsaved<OrderItem>[];
}) => {
  const queryClient = useQueryClient();
  const { data: userId } = useUserId();
  const { data: recentCart } = useRecentCart();
  const cart = recentCart?.status === 'complete' ? null : recentCart;
  const itemArray = Array.isArray(orderItem) ? orderItem : [orderItem];

  return useMutation({
    mutationFn: async () => {
      return axiosFetcher<Order>(
        `/api/orders/order${cart ? `?orderId=${cart.id}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: { action: 'add', shopId, orderItems: itemArray },
          withCredentials: true,
        },
      );
    },
    // onMutate: async () => {
    //   const optimisticCart: Cart = {
    //     id: cart?.id || generateUUID(),
    //     orderItems: [
    //       ...(cart?.orderItems || []),
    //       ...itemArray.map(i => ({ id: generateUUID(), ...i })),
    //     ],
    //     user: userId!,
    //     shop: shopId,
    //     status: 'pending',
    //     timestamp: cart?.timestamp || new Date().toISOString(),
    //     tip: cart?.tip || null,
    //   };

    //   queryClient.setQueryData([ORDERS_QUERY_KEY, userId!], (prev: Order[]) => {
    //     // replace the cart if it already exists
    //     if (!!cart)
    //       return prev.map(o =>
    //         o.id === optimisticCart.id ? optimisticCart : o,
    //       );
    //     // otherwise, unshift the cart on the front of the array
    //     return [optimisticCart, ..._.cloneDeep(prev)];
    //   });

    //   return { optimisticCart, initialCart: cart };
    // },
    onSettled: (data, _) => {
      queryClient.invalidateQueries({
        queryKey: [ORDERS_QUERY_KEY, userId!],
      });
      // if (!data) debugger;
      // return queryClient.setQueryData(
      //   [ORDERS_QUERY_KEY, userId!],
      //   (prev: Order[]) => prev.map(o => (o.id === data.id ? data : o)),
      // );
    },
    // onError: (_error, _, context) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [ORDERS_QUERY_KEY, userId!],
    //   });
    // queryClient.setQueryData([ORDERS_QUERY_KEY, userId!], (prev: Order[]) => {
    //   if (context && context.initialCart)
    //     return [context.initialCart, ...prev.slice(1)];
    //   return prev.slice(1);
    // });
    // },
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
    onSettled: variable => {
      queryClient.invalidateQueries({
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

export const useTipMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    scope: { id: 'tip' },

    mutationFn: async ({ order, tip }: { order: Order; tip: USDC | null }) =>
      await axiosFetcher<ReturnType<OrderRepository['update']>>(
        '/api/orders/order?orderId=' + order.id,
        {
          method: 'POST',
          data: {
            orderId: order.id,
            action: 'tip',
            tip: tip?.toUSD() ?? null,
          },
        },
      ),
    onMutate: async ({ order: originalOrder, tip }) => {
      await queryClient.cancelQueries({
        queryKey: [ORDERS_QUERY_KEY, originalOrder.user!],
      });

      const optimisticCart: Order = {
        ...originalOrder,
        tip: tip
          ? {
              amount: tip,
              // set a dummy address
              address: zeroAddress,
            }
          : null,
      };
      updateOrderInPlace(queryClient, optimisticCart);
      return { originalOrder, optimisticCart };
    },
    onSettled: variable => {
      queryClient.invalidateQueries({
        queryKey: [ORDERS_QUERY_KEY, variable?.id!],
      });
    },
    // onError(error, _, ctx) {
    //   console.error(error);
    //   if (!ctx) return;
    //   rollbackOrderUpdate(queryClient, ctx.originalOrder);
    // },
    // onSuccess: (result, { order }) => {
    //   if (result === null) removeOrder(queryClient, order);
    //   else updateOrderInPlace(queryClient, result);
    // },
  });
};

export const useFarmerAllocationFromOrder = (order: Order) => {
  const { data: shop } = useShop({ id: order.shop });
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
      return axiosFetcher<Order>(`/api/orders/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          transactionHash,
          orderId: cart.id,
          paidPrices: cart.orderItems.reduce(
            (acc, o) => ({
              ...acc,
              // the user pays the discount price
              [o.id]: getOrderItemCostFromPriceDict(priceDict, o).discountPrice,
            }),
            {},
          ),
        },
        withCredentials: true,
      });
    },
    onSettled: variable => {
      queryClient.invalidateQueries({
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
      queryClient.invalidateQueries({
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
    refetchInterval: 8_000,
    enabled: pendingOrders.length > 0,
  });
};
