import { privyWagmiConfig } from '@/components/providers.tsx/PrivyProvider';
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

export const sliceKit = {
  wagmiConfig: privyWagmiConfig,
  getStores: (params: GetStoresParams) => getStores(params),
  getStoreProducts: (params: GetStoreProductsParams) =>
    getStoreProducts(privyWagmiConfig, params),
  getStoreProducts_proxied: (params: GetStoreProductsParams) =>
    axiosFetcher<{ cartProducts: ProductCart[]; storeClosed: boolean }>(
      `/api/slice/get-store-products`,
      { data: params, method: 'POST' },
    ),
  getProduct: (params: GetProductParams) =>
    getProduct(privyWagmiConfig, params),
  payProducts: async (
    // wallet: ConnectedWallet,
    params: PayProductsParams,
  ) => {
    // const provider = await wallet.getEthereumProvider();

    return payProducts(
      privyWagmiConfig,
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
