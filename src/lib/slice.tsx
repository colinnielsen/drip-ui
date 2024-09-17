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
import { PRIVY_WAGMI_CONFIG } from './ethereum';
import { axiosFetcher } from './utils';

export const SLICE_CART_LOCAL_STORAGE_KEY = 'cart';

/**
 * @dev the address to approve USDC for to spend across slice stores
 */
export const SLICE_ENTRYPOINT_ADDRESS =
  '0xb9d5B99d5D0fA04dD7eb2b0CD7753317C2ea1a84';

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
