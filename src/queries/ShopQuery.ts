import { Item } from '@/data-model/item/ItemType';
import { ItemMod } from '@/data-model/item/ItemMod';
import { Shop, ShopConfig, ShopSourceConfig } from '@/data-model/shop/ShopType';
import { axiosFetcher, minutes } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UUID } from '@/data-model/_common/type/CommonType';
import { useWalletAddress } from './EthereumQuery';
import { useUser } from './UserQuery';
import {
  deriveShopConfigIdFromExternalId,
  mapShopSourceConfigToExternalId,
} from '@/data-model/shop/ShopDTO';

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
  const { data: user } = useUser();
  const connectedWallet = useWalletAddress();
  const walletAddress = connectedWallet ?? user?.wallet?.address;
  const initialData =
    client.getQueryData<Shop[]>(['shop'])?.find(shop => shop.id === id) ??
    client.getQueryData<Shop>(['shop', id]);

  // const includeDiscounts = !!(user?.id || walletAddress);
  // const queryParams = includeDiscounts
  //   ? `?includeDiscounts=true${user?.id ? `&userId=${user.id}` : ''}${walletAddress ? `&walletAddress=${walletAddress}` : ''}`
  //   : '';

  const shopQueryKey = [
    'shop',
    id,
    // ...(includeDiscounts ? [{ userId: user?.id, walletAddress }] : []),
  ];

  return useQuery({
    queryKey: shopQueryKey,
    queryFn: () => axiosFetcher<Shop>(`/api/shops/${id}`), //${queryParams}
    enabled: !!id,
    select,
    initialData,
  });
};

export const useShopSourceConfig = (id?: UUID) =>
  useShop({
    id,
    select: shop => shop.__sourceConfig,
  });

// export const useShopPriceDictionary = (id: UUID) =>
//   useShop({
//     id,
//     select: shop =>
//       Object.values(shop.menu)
//         .flat()
//         .reduce<Record<UUID, Item | ItemMod>>(
//           (acc, item) => ({
//             ...acc,
//             [item.id]: item,
//             ...item.mods.reduce((acc, mod) => ({ ...acc, [mod.id]: mod }), {}),
//           }),
//           {},
//         ),
//   });

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
