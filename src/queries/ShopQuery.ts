import { Shop } from '@/data-model/shop/ShopType';
import { axiosFetcher } from '@/lib/utils';
import {
  QueryObserverOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { UUID } from 'crypto';

export const useShops = () =>
  useQuery({
    queryKey: ['shops'],
    queryFn: () => axiosFetcher<Shop[]>('/api/shops'),
  });

export const shopQuery = (
  id?: UUID,
  initialData?: Shop,
): QueryObserverOptions<Shop> =>
  ({
    queryKey: ['shop', id],
    queryFn: () => axiosFetcher<Shop>(`/api/shops/${id}`),
    initialData,
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  }) as const;

export const useShop = (id?: UUID, _initialData?: Shop) => {
  const client = useQueryClient();
  const initialData =
    _initialData ??
    client.getQueryData<Shop[]>(['shops'])?.find(shop => shop.id === id) ??
    client.getQueryData<Shop>(['shop', id]);

  return useQuery(shopQuery(id, initialData));
};

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
