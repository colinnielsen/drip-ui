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

const sliceConfig = createConfig({
  chains: BASE_RPC_CONFIG.chains,
  transports: {
    '8453': BASE_RPC_CONFIG.transport,
  },
});

export default {
  sliceConfig,
  getStores: (params: GetStoresParams) => getStores(params),
  getStoreProducts: (params: GetStoreProductsParams) =>
    getStoreProducts(sliceConfig, params),
  getStoreProducts_proxied: (params: GetStoreProductsParams) =>
    axiosFetcher<{ cartProducts: ProductCart[]; storeClosed: boolean }>(
      `/api/slice/get-store-products`,
      { data: params, method: 'POST' },
    ),
  getProduct: (params: GetProductParams) => getProduct(sliceConfig, params),
  payProducts: async (wallet: ConnectedWallet, params: PayProductsParams) => {
    const provider = await wallet.getEthereumProvider();

    return payProducts(
      createConfig({
        chains: BASE_RPC_CONFIG.chains,

        connectors: [
          injected({
            target: {
              id: 'privy',
              name: 'Privy',
              provider: provider as any,
            },
          }),
        ],
        transports: {
          '8453': custom(provider),
        },
      }),
      params,
    );
  },
};
