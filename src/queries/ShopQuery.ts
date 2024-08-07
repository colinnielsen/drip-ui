import { Shop } from '@/data-model/shop/ShopType';
import { axiosFetcher, minutes } from '@/lib/utils';
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { UUID } from 'crypto';
import { Address } from 'viem';
import { useWalletAddress } from './EthereumQuery';
import { useUserId } from './UserQuery';

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
  const { data: userId } = useUserId();
  const connectedWallet = useWalletAddress();

  const initialData =
    client.getQueryData<Shop[]>(['shop'])?.find(shop => shop.id === id) ??
    client.getQueryData<Shop>(['shop', id]);

  const includeDiscounts = !!(userId || connectedWallet);
  const queryParams = includeDiscounts
    ? `?includeDiscounts=true${userId ? `&userId=${userId}` : ''}${connectedWallet ? `&walletAddress=${connectedWallet}` : ''}`
    : '';

  const shopQueryKey = [
    'shop',
    id,
    ...(includeDiscounts
      ? [{ userId, connectedWallet: connectedWallet ?? undefined }]
      : []),
  ];
  console.log('shopQueryKey', shopQueryKey);
  return useQuery({
    queryKey: shopQueryKey,
    queryFn: () => axiosFetcher<Shop>(`/api/shops/${id}${queryParams}`),
    enabled: !!id,
    select,
    initialData,
    staleTime: 0,
  });
};

// export const useListenForDiscountRetching = () => {
//   const { refetch } = useShop();
//   const wallet = useConnectedWallet();
//   const { data: userId } = useUserId();

//   useEffect(() => {
//     refetch();
//   }, [refetch, wallet?.address, userId]);

//   return null;
// };

// export const useItemByName = (id: UUID, category: ItemCategory, name: string) =>
//   useQuery({
//     queryKey: ['item', id, category, name],
//     queryFn: async () => {
//       const shop = await axiosFetcher<Shop>(`/api/shops/${id}`);
//       const item = shop?.menu?.[category]?.find(item => item.name === name);
//       if (!item) {
//         throw new Error(
//           `Item with name ${name} not found in category ${category}`,
//         );
//       }
//       return item;
//     },
//   });

// export const useShopItems = (id: UUID) =>
//   useQuery({
//     queryKey: ['shopItems', id],
//     queryFn: async () => {
//       const shop = (await axiosFetcher(`/api/shops/${id}`)) as Shop;
//       return shop.menu;
//     },
//   });

// export const useItemMods = (shopId: UUID, category: ItemCategory) =>
//   useQuery({
//     queryKey: ['itemMods', shopId, category],
//     queryFn: async () => {
//       const shop = await axiosFetcher<Shop>(`/api/shops/${shopId}`);
//       const options = shop.menu[category];

//       if (!options.length)
//         throw new Error(`No options found for category ${category}`);

//       return options;
//     },
//   });
