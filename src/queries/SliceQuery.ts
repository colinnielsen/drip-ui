import { PaymentStep, useCheckoutContext } from '@/components/cart/context';
import { USDC } from '@/data-model/_common/currency/USDC';
import { mapCartToSliceCart } from '@/data-model/_external/data-sources/slice/SliceDTO';
import { mapEthAddressToAddress } from '@/data-model/ethereum/EthereumDTO';
import { ChainId } from '@/data-model/ethereum/EthereumType';
import { Order } from '@/data-model/order/OrderType';
import { mapSliceExternalIdToSliceId } from '@/data-model/shop/ShopDTO';
import { USDC_CONFIG } from '@/lib/contract-config/USDC';
import { BASE_CLIENT, WAGMI_CONFIG } from '@/lib/ethereum';
import { useErrorToast } from '@/lib/hooks/use-toast';
import { SLICE_ENTRYPOINT_ADDRESS, sliceKit } from '@/lib/data-sources/slice';
import { axiosFetcher, minutes } from '@/lib/utils';
import { PayRequest } from '@/pages/api/orders/pay';
import {
  ExtraCostParamsOptional,
  ProductCart,
  handleCheckoutViem,
  payProductsConfig,
} from '@slicekit/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dispatch, SetStateAction, useCallback } from 'react';
import { Address, zeroAddress } from 'viem';
import { base } from 'viem/chains';
import { CART_QUERY_KEY, useCart, useDeleteCartMutation } from './CartQuery';
import {
  usePreferredWallet,
  useUSDCAllowance,
  usePreferredWalletClient,
  usePreferredWalletAddress,
} from './EthereumQuery';
import { ORDERS_QUERY_KEY } from './OrderQuery';
import { useShop } from './ShopQuery';
import { ACTIVE_USER_QUERY_KEY } from './UserQuery';

//
//// QUERIES
///

/**
 * @dev the user's current cart, mapped to a usable slicekit cart
 */
export const useCartInSliceFormat = ({
  buyerAddress,
}: {
  buyerAddress?: Address | null | undefined;
}) => {
  const { data: cart } = useCart();
  const { data: shop } = useShop({ id: cart?.shop });

  const slicerId =
    shop?.__sourceConfig.type === 'slice'
      ? mapSliceExternalIdToSliceId(shop.__sourceConfig.id)
      : undefined;

  return useSliceStoreProducts({
    slicerId,
    buyer: buyerAddress ?? undefined,
    // just select over the cartProducts and map them to an array of selected slice products
    select: cartProducts =>
      !cart ? [] : mapCartToSliceCart(cart, cartProducts),
  });
};

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

//
//// MUTATIONS
///

const handleLoadingState = (
  state: 'Purchasing' | 'Approve USDC' | 'Approving' | string,
  setPaymentStep: Dispatch<SetStateAction<PaymentStep>>,
) => {
  console.log('state', state);
  if (state === 'Approving') setPaymentStep('success');
  if (state === 'Purchasing') setTimeout(() => setPaymentStep('success'), 800);
};

export const usePayAndOrder = () => {
  const queryClient = useQueryClient();
  const deleteCartMutation = useDeleteCartMutation();
  const preferredWalletAddress = usePreferredWalletAddress();
  const walletClient = usePreferredWalletClient();

  const { setPaymentStep } = useCheckoutContext();

  const { data: dripCart } = useCart();
  const { data: shop } = useShop({ id: dripCart?.shop });
  const { data: sliceCart, isFetching: sliceCartIsFetching } =
    useCartInSliceFormat({ buyerAddress: preferredWalletAddress });
  const { data: allowance } = useUSDCAllowance({
    spender: SLICE_ENTRYPOINT_ADDRESS,
  });

  const errorToast = useErrorToast();

  const extraCosts: ExtraCostParamsOptional[] | undefined =
    dripCart?.tip &&
    shop?.tipConfig.recipient &&
    shop.__sourceConfig.type === 'slice'
      ? [
          {
            currency: dripCart.tip.amount.address,
            amount: dripCart.tip.amount.toWei(),
            recipient: mapEthAddressToAddress(shop.tipConfig.recipient),
            description: 'Tip',
            slicerId: BigInt(
              mapSliceExternalIdToSliceId(shop.__sourceConfig.id),
            ),
          },
        ]
      : undefined;

  const onError = useCallback(
    (error: any) => {
      errorToast('slice checkout failed! \n' + error);
      console.log(error);
      setPaymentStep('error');
    },
    [setPaymentStep],
  );

  const onSliceSuccess = useCallback(
    async ({ hash, orderId }: { orderId: string; hash: `0x${string}` }) => {
      if (!dripCart)
        throw new Error('No cart in usePayAndOrder (should not happen)');

      setPaymentStep('success');

      const returnedOrder = await axiosFetcher<Order, PayRequest>(
        `/api/orders/pay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            type: 'slice',
            transactionHash: hash,
            cart: dripCart,
            totalPaidWei: dripCart.quotedTotalAmount?.toWei() ?? 0n,
            payerAddress: preferredWalletAddress!,
            sliceOrderId: orderId,
          },
          withCredentials: true,
        },
      );

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
      await deleteCartMutation.mutateAsync({ cartId: dripCart.id });
    },
    [
      setPaymentStep,
      dripCart,
      queryClient,
      deleteCartMutation,
      preferredWalletAddress,
    ],
  );

  const ready =
    !!walletClient.client &&
    !!sliceCart &&
    !!preferredWalletAddress &&
    !!allowance &&
    !!dripCart?.quotedTotalAmount &&
    !sliceCartIsFetching;

  const buttonText = !ready
    ? ''
    : dripCart.quotedTotalAmount?.wei === 0n
      ? 'place order'
      : 'pay';

  const payAndOrder = async () => {
    if (!ready) throw new Error('No wallet connected');
    setPaymentStep('awaiting-confirmation');

    await walletClient.client?.switchChain({ id: base.id });
    const totalUsdcToPay = dripCart.quotedTotalAmount?.toWei();

    await handleCheckoutViem(BASE_CLIENT, walletClient.client!, {
      capabilities: null,
      payProductsConfig: await payProductsConfig(WAGMI_CONFIG, {
        account: preferredWalletAddress,
        cart: sliceCart,
        buyer: preferredWalletAddress,
        extraCosts,
      }),
      ref: '',
      referrer: zeroAddress,
      onError: onError,
      onSuccess: onSliceSuccess,
      buyer: preferredWalletAddress,
      setLoadingState: s => handleLoadingState(s, setPaymentStep),
      // @ts-ignore
      buyerInfo: null,
      cart: sliceCart,
      totalPrices: [
        {
          currency: {
            address: USDC_CONFIG[ChainId.BASE].address,
            decimals: USDC.decimals,
            symbol: 'USDC',
          },
          total: totalUsdcToPay ?? 0n,
        },
      ],
      allowances: [
        {
          currency: {
            address: USDC_CONFIG[ChainId.BASE].address,
            decimals: USDC.decimals,
            symbol: 'USDC',
          },
          allowance: allowance.toWei(),
        },
      ],
    });
  };

  return { payAndOrder, ready, buttonText };
};
