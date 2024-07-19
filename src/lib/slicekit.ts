import { createConfig, http } from '@wagmi/core';
import { base } from '@wagmi/core/chains';
import {
  getStores,
  getStoreProducts,
  GetStoresParams,
  GetStoreProductsParams,
  getProduct,
  GetProductParams,
} from '@slicekit/core';

const sliceConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(base.rpcUrls.default.http[0]),
  },
});

export default {
  sliceConfig,
  getStores: (params: GetStoresParams) => getStores(params),
  getStoreProducts: (params: GetStoreProductsParams) =>
    getStoreProducts(sliceConfig, params),
  getProduct: (params: GetProductParams) => getProduct(sliceConfig, params),
};
