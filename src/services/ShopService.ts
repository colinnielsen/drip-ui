import { mapSliceProductCartToItem } from '@/data-model/_common/type/SliceDTO';
import { Item, ItemCategory } from '@/data-model/item/ItemType';
import {
  EMPTY_MENU,
  getSlicerIdFromSliceStoreId,
} from '@/data-model/shop/ShopDTO';
import { Shop } from '@/data-model/shop/ShopType';
import { sliceKit } from '@/lib/slice';
import { UUID } from 'crypto';
import { Address } from 'viem';

export const includeDiscountsOnShop = async (
  shop: Shop,
  {
    walletAddress,
    userId,
  }: { walletAddress: Address | undefined; userId: string | undefined },
): Promise<Shop> => {
  // no op for other store types
  if (shop.__sourceConfig.type !== 'slice') return shop;

  const slicerId = getSlicerIdFromSliceStoreId(shop.__sourceConfig.id);
  const { cartProducts } = await sliceKit
    .getStoreProducts({
      slicerId,
      buyer: walletAddress,
    })
    .catch(e => {
      debugger;
      return { cartProducts: [] };
    });
  const discountedItemById = cartProducts
    .map(mapSliceProductCartToItem)
    .reduce<Record<UUID, Item>>(
      (acc, item) => ({
        ...acc,
        [item.id]: item,
      }),
      {},
    );

  return {
    ...shop,
    menu: Object.entries(shop.menu).reduce<Shop['menu']>(
      (acc, [category, items]) => ({
        ...acc,
        [category as ItemCategory]: items.map(item => ({
          ...item,
          discountPrice: discountedItemById[item.id].price || undefined,
        })),
      }),
      EMPTY_MENU,
    ),
  };
};

//
//// SERVICE OBJECT
///
export default {
  includeDiscountsOnShop,
};
