import { Shop } from '@/data-model/shop/ShopType';
import { axiosFetcher } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UUID } from 'crypto';
import { Address } from 'viem';
import { useConnectedWallet } from './EthereumQuery';
import { useUserId } from './UserQuery';

export const useShops = () =>
  useQuery({
    queryKey: ['shops'],
    queryFn: () => axiosFetcher<Shop[]>('/api/shops'),
  });

export const shopQuery = <TData = Shop>({
  id,
  initialData,
  userId,
  connectedWallet,
  select,
}: {
  id?: UUID;
  initialData?: Shop;
  userId?: UUID;
  connectedWallet?: Address;
  select?: (data: Shop) => TData;
} = {}) => {
  const includeDiscounts = !!(userId || connectedWallet);
  const queryParams = includeDiscounts
    ? `?includeDiscounts=true${userId ? `&userId=${userId}` : ''}${connectedWallet ? `&walletAddress=${connectedWallet}` : ''}`
    : '';

  return {
    queryKey: ['shop', id, { userId, connectedWallet }],
    queryFn: () => axiosFetcher<Shop>(`/api/shops/${id}${queryParams}`),
    initialData,
    enabled: !!id,
    // staleTime: 1000 * 60 * 5,
    select,
  };
};

export const useShop = <TData = Shop>({
  id,
  _initialData,
  select,
}: { id?: UUID; _initialData?: Shop; select?: (data: Shop) => TData } = {}) => {
  const client = useQueryClient();
  const { data: userId } = useUserId();
  const wallet = useConnectedWallet();
  const initialData =
    _initialData ??
    client.getQueryData<Shop[]>(['shops'])?.find(shop => shop.id === id) ??
    client.getQueryData<Shop>(['shop', id]);

  return useQuery(
    shopQuery({
      id,
      initialData,
      userId,
      connectedWallet: wallet?.address,
      select,
    }),
  );
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
