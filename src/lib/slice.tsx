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
import { BASE_RPC_CONFIG, WAGMI_CONFIG } from './ethereum';
import { axiosFetcher } from './utils';
import { createConfig } from '@wagmi/core';
import { base } from 'viem/chains';
import { getSliceSubgraphApiKey } from './constants';

export const SLICE_CART_LOCAL_STORAGE_KEY = 'cart';

/**
 * @dev the address to approve USDC for to spend across slice stores
 */
export const SLICE_ENTRYPOINT_ADDRESS =
  '0xb9d5B99d5D0fA04dD7eb2b0CD7753317C2ea1a84';

export const sliceKit = {
  wagmiConfig: WAGMI_CONFIG,
  getStores: (params: GetStoresParams) => getStores(params),
  getStoreProducts: (params: GetStoreProductsParams) => {
    const config = createConfig({
      transports: {
        [base.id]: BASE_RPC_CONFIG.transport,
      },
      chains: [base],
      ssr: true,
    });
    console.log('config', config);
    const fullParams = {
      ...params,
      chainId: 8453,
      dynamicPricing: true,
      thegraphApiKey: getSliceSubgraphApiKey(),
    };
    console.log('params', fullParams);
    return getStoreProducts(config, fullParams);
  },
  getStoreProducts_proxied: (params: GetStoreProductsParams) =>
    axiosFetcher<{ cartProducts: ProductCart[]; storeClosed: boolean }>(
      `/api/slice/get-store-products`,
      { data: params, method: 'POST' },
    ),
  /**
   * @returns all products that come from this query, both price and basePrice are the same
   */
  updateDynamicProducts: (params: UpdateDynamicProductsParams) =>
    updateDynamicProducts(WAGMI_CONFIG, params),
  getProduct: (params: GetProductParams) => getProduct(WAGMI_CONFIG, params),
  getOrder: (params: GetOrderParams) => getOrder(params),
  payProducts: async (
    // wallet: ConnectedWallet,
    params: PayProductsParams,
  ) => {
    // const provider = await wallet.getEthereumProvider();

    return payProducts(
      WAGMI_CONFIG,
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
