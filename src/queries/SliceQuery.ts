import { useCheckoutContext } from '@/components/cart/context';
import { getSlicerIdFromSliceStoreId } from '@/data-model/shop/ShopDTO';
import { sliceKit } from '@/lib/slice';
import { minutes } from '@/lib/utils';
import { ExtraCostParamsOptional, ProductCart } from '@slicekit/core';
import { useCheckout } from '@slicekit/react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { Address } from 'viem';
import { base } from 'viem/chains';
import { useConnectedWallet } from './EthereumQuery';
import {
  useAssocateExternalOrderInfoToCart,
  useAssocatePaymentToCart,
  useRecentCart,
} from './OrderQuery';
import { useShopSourceConfig } from './ShopQuery';

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
}: {
  onSuccess?: () => void;
} = {}) => {
  const wallet = useConnectedWallet();

  const { data: dripCart } = useRecentCart();
  const { data: shopSourceConfig } = useShopSourceConfig(dripCart?.shop);
  const { mutateAsync: associatePayment } = useAssocatePaymentToCart();
  const { mutateAsync: associateExternalOrderInfo } =
    useAssocateExternalOrderInfoToCart();
  const { setPaymentStep } = useCheckoutContext();

  const extraCosts: ExtraCostParamsOptional[] | undefined = useMemo(
    () =>
      dripCart?.tip && shopSourceConfig?.id
        ? [
            {
              currency: dripCart.tip.amount.address,
              amount: dripCart.tip.amount.toWei(),
              recipient: dripCart.tip.address,
              description: 'Tip',
              slicerId: BigInt(
                getSlicerIdFromSliceStoreId(shopSourceConfig.id),
              ),
            },
          ]
        : undefined,
    [dripCart?.tip, shopSourceConfig?.id],
  );

  const onError = useCallback(
    (error: { orderId: string; hash: `0x${string}` }) => {
      console.log({ sliceError: error });
      setPaymentStep('error');
    },
    [setPaymentStep],
  );

  const onSliceSuccess = useCallback(
    async ({ hash, orderId }: { orderId: string; hash: `0x${string}` }) => {
      setPaymentStep('success');
      await associatePayment(hash);
      await associateExternalOrderInfo({
        __type: 'slice',
        orderId,
      });
      onSuccess?.();
    },
    [associateExternalOrderInfo, associatePayment, onSuccess, setPaymentStep],
  );

  const useCheckoutParams = useMemo(
    () => ({
      buyer: wallet?.address.toLowerCase() as Address,
      extraCosts,
      onError,
      onSuccess: onSliceSuccess,
    }),
    [extraCosts, onError, onSliceSuccess, wallet?.address],
  );

  const { checkout: initiatePrivyCheckout, errors } = useCheckout(
    sliceKit.wagmiConfig,
    useCheckoutParams,
  );
  console.log({ errors });
  const payAndOrder = useCallback(async () => {
    setPaymentStep('awaiting-confirmation');
    await wallet?.switchChain(base.id);
    await initiatePrivyCheckout().catch(error => console.error(error));
  }, [initiatePrivyCheckout, setPaymentStep]);

  if (!wallet) throw new Error('No wallet connected');
  else return payAndOrder;
};
