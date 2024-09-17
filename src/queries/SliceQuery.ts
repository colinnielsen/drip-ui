import { useCheckoutContext } from '@/components/cart/context';
import { getSlicerIdFromSliceStoreId } from '@/data-model/shop/ShopDTO';
import { BASE_CLIENT, PRIVY_WAGMI_CONFIG } from '@/lib/ethereum';
import { SLICE_ENTRYPOINT_ADDRESS, sliceKit } from '@/lib/slice';
import { minutes } from '@/lib/utils';
import {
  ExtraCostParamsOptional,
  ProductCart,
  handleCheckoutViem,
  payProductsConfig,
} from '@slicekit/core';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { Address, zeroAddress } from 'viem';
import { base } from 'viem/chains';
import {
  useConnectedWallet,
  useUSDCAllowance,
  useWalletClient,
} from './EthereumQuery';
import {
  useAssocateExternalOrderInfoToCart,
  useAssocatePaymentToCart,
  useCartInSliceFormat,
  useCartSummary,
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

export const usePayAndOrder = ({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) => {
  const wallet = useConnectedWallet();
  const walletClient = useWalletClient();
  const address = wallet?.address as Address;

  const { data: dripCart } = useRecentCart();
  const { data: sliceCart } = useCartInSliceFormat({ buyerAddress: address });
  const { data: shopSourceConfig } = useShopSourceConfig(dripCart?.shop);
  const { mutateAsync: associatePayment } = useAssocatePaymentToCart();
  const { mutateAsync: associateExternalOrderInfo } =
    useAssocateExternalOrderInfoToCart();
  const { setPaymentStep } = useCheckoutContext();
  const summary = useCartSummary();
  const { data: allowance } = useUSDCAllowance({
    spender: SLICE_ENTRYPOINT_ADDRESS,
  });

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

  const ready =
    !!wallet &&
    !!walletClient &&
    !!sliceCart &&
    !!address &&
    !!summary &&
    !!allowance;

  const payAndOrder = async () => {
    if (!ready) throw new Error('No wallet connected');
    setPaymentStep('awaiting-confirmation');

    await wallet?.switchChain(base.id);
    const totalUsdcToPay = summary?.total.usdc.toWei();
    await handleCheckoutViem(BASE_CLIENT, walletClient, {
      // @ts-ignore
      buyerInfo: null,
      // @ts-ignore
      capabilities: null,
      payProductsConfig: await payProductsConfig(PRIVY_WAGMI_CONFIG, {
        account: address,
        cart: sliceCart,
        buyer: address,
        extraCosts,
      }),
      ref: '',
      referrer: zeroAddress,
      onError: onError,
      onSuccess: onSliceSuccess,
      buyer: address,
      setLoadingState: console.debug,
      totalUsdcToPay,
      cart: sliceCart,
      allowance: allowance.toWei(),
    }).catch(error => console.error(error));
  };

  if (!wallet) throw new Error('No wallet connected');
  else return { payAndOrder, ready };
};
