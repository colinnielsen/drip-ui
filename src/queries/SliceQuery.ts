import { useCheckoutContext } from '@/components/cart/context';
import { getSlicerIdFromSliceStoreId } from '@/data-model/shop/ShopDTO';
import { PRIVY_WAGMI_CONFIG } from '@/lib/ethereum';
import { sliceKit } from '@/lib/slice';
import { minutes } from '@/lib/utils';
import { ExtraCostParamsOptional, ProductCart } from '@slicekit/core';
import { useCheckout } from '@slicekit/react';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Address } from 'viem';
import { useConnectedWallet } from './EthereumQuery';
import {
  useAssocateExternalOrderInfoToCart,
  useAssocatePaymentToCart,
  useCart,
} from './OrderQuery';
import { useShop } from './ShopQuery';
import { base } from 'viem/chains';

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
    select: select ? data => select(data.cartProducts) : undefined,
  });

// export type PriceLookup = Record<
//   UUID,
//   {
//     basePrice: Currency;
//     discountedPrice: Currency;
//     modPrices: { modId: UUID; price: Currency }[];
//   }
// >;
// /**
//  * @returns a map of {[dripItemId]: discountedPrice}
//  * { [{@link deriveDripIdFromSliceProductId}]: {@link Currency} }
//  */
// export const useSlicePrices = (config: SliceDataSourceConfig | undefined) => {
//   const wallet = useConnectedWallet();

//   return useSliceStoreProducts({
//     slicerId: config ? getSlicerIdFromSliceStoreId(config.id) : undefined,
//     buyer: wallet?.address,
//     enabled: config?.type === 'slice',
//     select: data =>
//       data.reduce<PriceLookup>(
//         (acc, product) => ({
//           ...acc,
//           [deriveDripIdFromSliceProductId(product)]: {
//             discountedPrice: getPriceFromSliceCart(
//               product.currency,
//               product.price,
//             ).price,
//             basePrice: getPriceFromSliceCart(
//               product.currency,
//               product.basePrice,
//             ).price,
//             // slice mods do not have additional costs
//             modPrices: [],
//           },
//         }),
//         {},
//       ),
//   });
// };

export const usePayAndOrder = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const wallet = useConnectedWallet();
  const { data: dripCart } = useCart();
  const { data: shop } = useShop({ id: dripCart?.shop });
  const { mutateAsync: associatePayment } = useAssocatePaymentToCart();
  const { mutateAsync: associateExternalOrderInfo } =
    useAssocateExternalOrderInfoToCart();
  const { setPaymentStep } = useCheckoutContext();

  const extraCosts: ExtraCostParamsOptional[] | undefined = dripCart?.tip
    ? [
        {
          currency: dripCart.tip.amount.address,
          amount: dripCart.tip.amount.toWei(),
          recipient: dripCart.tip.address,
          description: 'Tip',
          slicerId: BigInt(
            getSlicerIdFromSliceStoreId(shop!.__sourceConfig.id),
          ),
        },
      ]
    : undefined;

  const { checkout: initiatePrivyCheckout } = useCheckout(PRIVY_WAGMI_CONFIG, {
    extraCosts,
    buyer: wallet?.address,
    onError: error => {
      console.log({ sliceError: error });
      setPaymentStep('error');
    },
    onSuccess: async ({ hash, orderId }) => {
      setPaymentStep('success');
      await associatePayment(hash);
      await associateExternalOrderInfo({
        __type: 'slice',
        orderId,
      });
      onSuccess?.();
    },
  });

  const payAndOrder = useCallback(async () => {
    setPaymentStep('awaiting-confirmation');
    await wallet?.wallet.switchChain(base.id);
    await initiatePrivyCheckout().catch(error => {
      debugger;
      console.error(error);
    });
  }, [initiatePrivyCheckout, setPaymentStep]);

  if (!wallet) throw new Error('No wallet connected');
  else return payAndOrder;
};
