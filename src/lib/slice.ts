import {
  GetProductParams,
  GetStoreProductsParams,
  GetStoresParams,
  PayProductsParams,
  ProductCart,
  getProduct,
  getStoreProducts,
  getStores,
  payProducts,
} from '@slicekit/core';
import { axiosFetcher } from './utils';
import { PRIVY_WAGMI_CONFIG } from './ethereum';

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
  getProduct: (params: GetProductParams) =>
    getProduct(PRIVY_WAGMI_CONFIG, params),
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
