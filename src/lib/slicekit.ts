import { ConnectedWallet } from '@privy-io/react-auth';
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
import { createConfig, custom, injected } from '@wagmi/core';
import { BASE_RPC_CONFIG } from './constants';
import { axiosFetcher } from './utils';
import { privyWagmiConfig } from '@/components/providers.tsx/PrivyProvider';

export default {
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
