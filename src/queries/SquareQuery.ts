import { useCheckoutContext } from '@/components/cart/context';
import { isUSDC, USDC } from '@/data-model/_common/currency/USDC';
import { ChainId } from '@/data-model/ethereum/EthereumType';
import { Order } from '@/data-model/order/OrderType';
import { USDC_CONFIG } from '@/lib/contract-config/USDC';
import { BASE_CLIENT } from '@/lib/ethereum';
import { useErrorToast } from '@/lib/hooks/use-toast';
import { axiosFetcher } from '@/lib/utils';
import {
  AuthorizationPayloadRequest,
  AuthorizationPayloadResponse,
} from '@/pages/api/orders/authorization-payload';
import { PayRequest } from '@/pages/api/orders/pay';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCart, useDeleteCartMutation } from './CartQuery';
import {
  usePreferredWallet,
  usePreferredWalletAddress,
  usePreferredWalletClient,
} from './EthereumQuery';
import { ORDERS_QUERY_KEY } from './OrderQuery';
import { ACTIVE_USER_QUERY_KEY } from './UserQuery';

export const usePayAndOrder = () => {
  const preferredWalletAddress = usePreferredWalletAddress();
  const walletClient = usePreferredWalletClient();
  const queryClient = useQueryClient();
  const errorToast = useErrorToast();

  const { data: cart } = useCart();
  const deleteCartMutation = useDeleteCartMutation();

  const { setPaymentStep } = useCheckoutContext();

  const ready =
    !!walletClient.client &&
    !!cart &&
    !!cart.quotedTotalAmount &&
    isUSDC(cart.quotedTotalAmount) &&
    !!preferredWalletAddress;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ready) throw new Error('Not ready');

      setPaymentStep('awaiting-confirmation');
      const { domain, transferAuthorization, types } = await axiosFetcher<
        AuthorizationPayloadResponse,
        AuthorizationPayloadRequest
      >('/api/orders/authorization-payload', {
        method: 'POST',
        data: {
          shopId: cart.shop,
          orderTotal: cart.quotedTotalAmount as USDC,
          payee: preferredWalletAddress,
        },
      });

      const signature = await walletClient.client!.signTypedData({
        domain,
        types,
        message: {
          ...transferAuthorization,
          validAfter: transferAuthorization.validAfter,
          validBefore: transferAuthorization.validBefore,
        },
        primaryType: 'TransferWithAuthorization',
      });

      setPaymentStep('paying');

      const { address, abi } = USDC_CONFIG[ChainId.BASE];

      await BASE_CLIENT.simulateContract({
        address,
        abi,
        functionName: 'transferWithAuthorization',
        args: [
          transferAuthorization.from,
          transferAuthorization.to,
          transferAuthorization.value,
          transferAuthorization.validAfter,
          transferAuthorization.validBefore,
          transferAuthorization.nonce,
          signature,
        ],
      });

      // send the signature and the paid prices to the backend
      const order = await axiosFetcher<Order, PayRequest>('/api/orders/pay', {
        method: 'POST',
        data: {
          type: 'square',
          usdcAuthorization: {
            ...transferAuthorization,
            signature,
          },
          cart,
        },
      });

      return { cart, order };
    },
    onSuccess: async ({ cart, order: returnedOrder }) => {
      setPaymentStep('success');

      // refetch queries:
      // 1. user
      await queryClient.refetchQueries({
        queryKey: [ACTIVE_USER_QUERY_KEY],
      });

      // add the order to the orders (if any)
      queryClient.setQueryData(
        [ORDERS_QUERY_KEY, returnedOrder.user],
        (orders: Order[]) => {
          return [returnedOrder, ...(orders || [])];
        },
      );

      // refetch queries:
      // 2. orders
      queryClient.refetchQueries({
        queryKey: [ORDERS_QUERY_KEY],
      });

      // 3. orders
      // delete the cart
      await deleteCartMutation.mutateAsync({ cartId: cart.id });
    },
    onError(error) {
      if (error.name !== 'UserRejectedRequestError') errorToast(error);
      setPaymentStep('error');
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    ready,
  };
};
