import { UUID } from '@/data-model/_common/type/CommonType';
import { needsSyncing } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { axiosFetcher, sortDateAsc, uniqBy } from '@/lib/utils';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFarmer } from './FarmerQuery';
import { useShop } from './ShopQuery';
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
