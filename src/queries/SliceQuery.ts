import { PRIVY_WAGMI_CONFIG } from '@/lib/ethereum';
import { sliceKit } from '@/lib/slice';
import { minutes } from '@/lib/utils';
import { ProductCart } from '@slicekit/core';
import { useCheckout } from '@slicekit/react';
import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';
import { useConnectedWallet } from './EthereumQuery';
import { useAssocatePaymentToCart } from './OrderQuery';

/**
 * @returns the slice keyed by productId
 */
export const useSliceStoreProducts = <TData = ProductCart[]>({
  slicerId,
  buyer,
  select,
  enabled = true,
}: {
  slicerId?: number;
  buyer?: Address;
  select?: (data: ProductCart[]) => TData;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: [`slice-store-products`, slicerId, buyer],
    queryFn: () =>
      sliceKit.getStoreProducts_proxied({
        slicerId: slicerId!,
        buyer,
      }),
    enabled: !!slicerId && enabled,
    staleTime: minutes(6),
    select: data => select?.(data.cartProducts) ?? data.cartProducts,
  });

export const usePayAndOrder = ({ onSuccess }: { onSuccess: () => void }) => {
  const wallet = useConnectedWallet();
  const { mutateAsync: associatePayment } = useAssocatePaymentToCart();

  const { checkout } = useCheckout(PRIVY_WAGMI_CONFIG, {
    buyer: wallet?.address,
    onError: error => {
      debugger;
      console.error(error);
    },
    onSuccess: async ({ hash, orderId }) => {
      await associatePayment(hash);
      onSuccess();
    },
  });

  if (!wallet) throw new Error('No wallet connected');
  else return checkout;
};
