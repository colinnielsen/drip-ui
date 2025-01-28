import { UUID } from '@/data-model/_common/type/CommonType';
import { DiscountQuote } from '@/data-model/discount/DiscountType';
import { Shop } from '@/data-model/shop/ShopType';
import { axiosFetcher, minutes } from '@/lib/utils';
import { QuoteRequest } from '@/pages/api/quote';
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { useWalletAddress } from './EthereumQuery';
import { useUser } from './UserQuery';

export const useShops = () =>
  useQuery({
    queryKey: ['shop'],
    queryFn: () => axiosFetcher<Shop[]>('/api/shops'),
    staleTime: minutes(5),
  });

export const useShop = <TData = Shop>({
  id,
  select,
}: { id?: UUID; select?: (data: Shop) => TData } = {}) => {
  const client = useQueryClient();
  const initialData =
    client.getQueryData<Shop[]>(['shop'])?.find(shop => shop.id === id) ??
    client.getQueryData<Shop>(['shop', id]);

  const shopQueryKey = ['shop', id];

  return useQuery({
    queryKey: shopQueryKey,
    queryFn: () => axiosFetcher<Shop>(`/api/shops/${id}`),
    enabled: !!id,
    select,
    initialData,
  });
};

export const useShopDiscounts = <TData = DiscountQuote[]>({
  shopId,
  enabled,
  select,
}: {
  shopId?: UUID;
  enabled?: boolean;
  select?: (data: DiscountQuote[]) => TData;
} = {}) => {
  const connectedWallet = useWalletAddress() ?? undefined;
  const { data: user, isLoading: userIsLoading } = useUser();

  const ready = !userIsLoading && !!shopId && enabled;

  return useQuery({
    queryKey: ['discounts', shopId, connectedWallet, user?.id],
    queryFn: ready
      ? () =>
          axiosFetcher<DiscountQuote[], QuoteRequest>(`/api/quote`, {
            method: 'POST',
            data: {
              type: 'all',
              shopId,
              userWalletAddress: connectedWallet,
              userId: user?.id,
            },
          })
      : skipToken,
    enabled: ready,
    select,
    staleTime: minutes(60),
  });
};

export const useShopSourceConfig = (id?: UUID) =>
  useShop({
    id,
    select: shop => shop.__sourceConfig,
  });
