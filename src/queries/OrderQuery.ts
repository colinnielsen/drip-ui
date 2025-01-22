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
  const { data: cart } = useCart();
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

  return useMutation({
    scope: { id: 'cart' },
    mutationFn: async (transactionHash: Hash) => {
      if (!cart) throw Error('No cart');

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
