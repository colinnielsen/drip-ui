import { useCheckoutContext } from '@/components/cart/context';
import { isUSDC, USDC } from '@/data-model/_common/currency/USDC';
import { ChainId } from '@/data-model/ethereum/EthereumType';
import { Order } from '@/data-model/order/OrderType';
import { LocalStorageCartPersistance } from '@/infrastructures/local-storage/CartPersistance';
import { USDC_CONFIG } from '@/lib/contract-config/USDC';
import { BASE_CLIENT, USDC_INSTANCE } from '@/lib/ethereum';
import { useErrorToast } from '@/lib/hooks/use-toast';
import { axiosFetcher } from '@/lib/utils';
import {
  AuthorizationPayloadRequest,
  AuthorizationPayloadResponse,
} from '@/pages/api/orders/authorization-payload';
import { PayRequest } from '@/pages/api/orders/pay';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CART_QUERY_KEY, useCart } from './CartQuery';
import { useConnectedWallet, useWalletClient } from './EthereumQuery';
import { ORDERS_QUERY_KEY } from './OrderQuery';
import { encodeFunctionData, parseSignature } from 'viem';

export const usePayAndOrder = () => {
  const wallet = useConnectedWallet();
  const walletClient = useWalletClient();
  const queryClient = useQueryClient();
  const errorToast = useErrorToast();

  const { data: cart } = useCart();
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
      try {
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

        const signature = await walletClient.signTypedData({
          domain,
          types,
          message: {
            ...transferAuthorization,
            validAfter: transferAuthorization.validAfter,
            validBefore: transferAuthorization.validBefore,
          },
          account: wallet.address as `0x${string}`,
          primaryType: 'TransferWithAuthorization',
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
        setPaymentStep('success');

        return { cart, order };
      } catch (error) {
        errorToast(error);
        setPaymentStep('error');
        throw error;
      }
    },
    onSuccess: ({ cart, order: returnedOrder }) => {
      // remove the cart from localstorage
      LocalStorageCartPersistance.remove(cart.id);

      // refetch both the orders and the cart
      queryClient.refetchQueries({
        queryKey: [ORDERS_QUERY_KEY],
      });
      queryClient.refetchQueries({
        queryKey: CART_QUERY_KEY(),
      });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    ready,
  };
};
