import {
  useIncompleteOrders,
  usePollExternalServiceForOrderCompletion,
} from '@/queries/OrderQuery';

export const GlobalListeners = () => {
  const { data: incompleteOrders } = useIncompleteOrders();
  usePollExternalServiceForOrderCompletion(incompleteOrders || []);

  return null;
};
