import { useCheckoutContext } from '@/components/cart/context';
import { getOrderItemCostFromPriceDict } from '@/data-model/order/OrderDTO';
import { Order } from '@/data-model/order/OrderType';
import { axiosFetcher } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { useConnectedWallet, useWalletClient } from './EthereumQuery';
import { useRecentCart } from './OrderQuery';
import { useShopPriceDictionary } from './ShopQuery';

export const usePayAndOrder = () => {
  const wallet = useConnectedWallet();
  const walletClient = useWalletClient();

  const { data: cart } = useRecentCart();
  const { setPaymentStep } = useCheckoutContext();
  const { data: priceDict } = useShopPriceDictionary(cart?.shop!);

  const promptForSignature = async () => {
    return Promise.resolve('0x1234');
  };

  const ready = !!cart && !!priceDict;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ready) throw new Error('Not ready');
      setPaymentStep('awaiting-confirmation');
      try {
        // prompt for signature
        const signature = await promptForSignature();
        console.log('signature', signature);
        // send the signature and the paid prices to the backend
        const order = await axiosFetcher<Order>('/api/orders/pay', {
          method: 'POST',
          data: {
            type: 'square',
            signature,
            orderId: cart.id,
            paidPrices: cart.orderItems.reduce(
              (acc, o) => ({
                ...acc,
                // the user pays the discount price
                [o.id]: getOrderItemCostFromPriceDict(priceDict, o)
                  .discountPrice,
              }),
              {},
            ),
          },
        });
        setPaymentStep('success');

        return order;
      } catch (error) {
        setPaymentStep('error');
        throw error;
      }
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    ready,
  };
};
