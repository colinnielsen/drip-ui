import { useWalletAddress } from '@/queries/EthereumQuery';
import { useCartInSliceFormat } from '@/queries/OrderQuery';
import {
  getOrder,
  GetOrderParams,
  getProduct,
  GetProductParams,
  getStoreProducts,
  GetStoreProductsParams,
  getStores,
  GetStoresParams,
  payProducts,
  PayProductsParams,
  ProductCart,
  updateDynamicProducts,
  UpdateDynamicProductsParams,
} from '@slicekit/core';
import { useCart as useSliceCart } from '@slicekit/react';
import { ReactNode, useEffect } from 'react';
import { PRIVY_WAGMI_CONFIG } from './ethereum';
import { axiosFetcher } from './utils';

export const SLICE_CART_LOCAL_STORAGE_KEY = 'cart';

export const sliceKit = {
  wagmiConfig: PRIVY_WAGMI_CONFIG,
  getStores: (params: GetStoresParams) => getStores(params),
  getStoreProducts: (params: GetStoreProductsParams) =>
    getStoreProducts(PRIVY_WAGMI_CONFIG, params),
  getStoreProducts_proxied: (params: GetStoreProductsParams) =>
    axiosFetcher<{ cartProducts: ProductCart[]; storeClosed: boolean }>(
      `/api/slice/get-store-products`,
      { data: params, method: 'POST' },
    ),
  /**
   * @returns all products that come from this query, both price and basePrice are the same
   */
  updateDynamicProducts: (params: UpdateDynamicProductsParams) =>
    updateDynamicProducts(PRIVY_WAGMI_CONFIG, params),
  getProduct: (params: GetProductParams) =>
    getProduct(PRIVY_WAGMI_CONFIG, params),
  getOrder: (params: GetOrderParams) => getOrder(params),
  payProducts: async (
    // wallet: ConnectedWallet,
    params: PayProductsParams,
  ) => {
    // const provider = await wallet.getEthereumProvider();

    return payProducts(
      PRIVY_WAGMI_CONFIG,
      // createConfig({
      //   chains: BASE_RPC_CONFIG.chains,

      //   connectors: [
      //     injected({
      //       target: {
      //         id: 'privy',
      //         name: 'Privy',
      //         provider: provider as any,
      //       },
      //     }),
      //   ],
      //   transports: {
      //     '8453': custom(provider),
      //   },
      // }),
      params,
    );
  },
};

export const SliceCartListener = ({ children }: { children: ReactNode }) => {
  const walletAddress = useWalletAddress();
  const { data: sliceCart } = useCartInSliceFormat({
    buyerAddress: walletAddress,
  });
  const { updateCart } = useSliceCart();
  const cartHash = sliceCart
    ?.map(i => i.slicerId + i.dbId + i.name + i.quantity + i.externalVariantId)
    .join('');

  useEffect(() => {
    console.debug('hydrating cart', { cartHash });
    updateCart(sliceCart || []);
  }, [cartHash]);

  return <>{children}</>;
};
