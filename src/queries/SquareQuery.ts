import { useCheckoutContext } from '@/components/cart/context';
import { isUSDC, USDC } from '@/data-model/_common/currency/USDC';
import { Order } from '@/data-model/order/OrderType';
import { useErrorToast } from '@/lib/hooks/use-toast';
import { axiosFetcher } from '@/lib/utils';
import {
  AuthorizationPayloadRequest,
  AuthorizationPayloadResponse,
} from '@/pages/api/orders/authorization-payload';
import { PayRequest } from '@/pages/api/orders/pay';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CART_QUERY_KEY, useCart, useDeleteCartMutation } from './CartQuery';
import { useConnectedWallet, useWalletClient } from './EthereumQuery';
import { ORDERS_QUERY_KEY } from './OrderQuery';
import { BASE_CLIENT, USDC_INSTANCE } from '@/lib/ethereum';
import { ChainId } from '@/data-model/ethereum/EthereumType';
import { USDC_CONFIG } from '@/lib/contract-config/USDC';
import { useWallets } from '@privy-io/react-auth';

export const usePayAndOrder = () => {
  const wallet = useConnectedWallet();
  const walletClient = useWalletClient();
  const wallets = useWallets();
  const queryClient = useQueryClient();
  const errorToast = useErrorToast();

  const { data: cart } = useCart();
  const deleteCartMutation = useDeleteCartMutation();

  const { setPaymentStep } = useCheckoutContext();

  const ready =
    walletClient &&
    !!cart &&
    !!cart.quotedTotalAmount &&
    isUSDC(cart.quotedTotalAmount) &&
    !!wallet?.address;

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
          payee: wallet.address as `0x${string}`,
        },
      });
      console.log(wallets);
      const signature = await walletClient.signTypedData({
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

      const t = await BASE_CLIENT.simulateContract({
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
    onSuccess: ({ cart, order: returnedOrder }) => {
      setPaymentStep('success');

      // delete the cart
      deleteCartMutation.mutateAsync({ cartId: cart.id });

      // add the order to the orders
      queryClient.setQueryData(
        [ORDERS_QUERY_KEY, returnedOrder.user],
        (orders: Order[]) => {
          return [returnedOrder, ...orders];
        },
      );

      // refetch both the orders and the cart
      queryClient.refetchQueries({
        queryKey: [ORDERS_QUERY_KEY, returnedOrder.user],
      });
      queryClient.refetchQueries({
        queryKey: CART_QUERY_KEY(),
      });
    },
    onError(error) {
      setPaymentStep('error');
      errorToast(error);
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    ready,
  };
};
