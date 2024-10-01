import { mapSliceProductCartToItem } from '@/data-model/_common/type/SliceDTO';
import { Item, ItemCategory } from '@/data-model/item/ItemType';
import {
  EMPTY_MENU,
  getSlicerIdFromSliceStoreId,
  isStorefront,
} from '@/data-model/shop/ShopDTO';
import { Shop } from '@/data-model/shop/ShopType';
import { sliceKit } from '@/lib/slice';
import { rehydrateData } from '@/lib/utils';
import { sql } from '@vercel/postgres';
import { UUID } from 'crypto';
import { Address } from 'viem';

const findById = async (
  id: UUID,
  { rehydrate = true } = {},
): Promise<Shop | null> => {
  const result = await sql`SELECT * FROM shops WHERE id = ${id}`;
  const shop = result.rows[0] as Shop | null;

  return shop ? (rehydrate ? _rehydrate(shop) : shop) : null;
};

const findAll = async ({ rehydrate = true } = {}): Promise<Shop[]> => {
  const result = await sql`SELECT * FROM shops`;
  const shops = result.rows as Shop[];
  return rehydrate ? shops.map(_rehydrate) : shops;
};

const save = async (shop: Shop): Promise<Shop> => {
  await sql`
    INSERT INTO shops (
      id,
      __type,
      label,
      "backgroundImage",
      logo,
      "farmerAllocations",
      menu,
      "__sourceConfig",
      location,
      "tipConfig"
    )
    VALUES (
      ${shop.id},
      ${shop.__type},
      ${shop.label},
      ${shop.backgroundImage},
      ${shop.logo},
      ${JSON.stringify(shop.farmerAllocations)},
      ${JSON.stringify(shop.menu)},
      ${JSON.stringify(shop.__sourceConfig)},
      ${isStorefront(shop) ? JSON.stringify(shop.location) : null},
      ${JSON.stringify(shop.tipConfig)}
    )
    ON CONFLICT (id) DO UPDATE SET
      __type = EXCLUDED.__type,
      "__sourceConfig" = EXCLUDED."__sourceConfig",
      label = EXCLUDED.label,
      "backgroundImage" = EXCLUDED."backgroundImage",
      logo = EXCLUDED.logo,
      url = EXCLUDED.url,
      "farmerAllocations" = EXCLUDED."farmerAllocations",
      menu = EXCLUDED.menu,
      location = EXCLUDED.location,
      "tipConfig" = EXCLUDED."tipConfig"
  `;
  return shop;
};

const remove = async (id: UUID): Promise<void> => {
  const result = await sql`DELETE FROM shops WHERE id = ${id}`;
  if (result.rowCount === 0) throw Error('could not delete');
};

const _rehydrate = (shop: Shop): Shop => {
  return rehydrateData(shop);
};

/**
 * @dev takes a shop and returns the shop with the `discountPrice` field set on the menu items
 * based on the current user's wallet address and current shop discounts
 */
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
  console.debug('slicerId', slicerId);
  const { cartProducts } = await sliceKit
    .getStoreProducts({
      slicerId,
      buyer: walletAddress,
    })
    .catch(err => {
      console.error('error getting store products', err);
      return { cartProducts: [] };
    });
  console.debug('cartProducts');
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
          discountPrice: discountedItemById[item.id]?.price || undefined,
        })),
      }),
      EMPTY_MENU,
    ),
  };
};

//
//// SERVICE OBJECT
///
const shopService = {
  findById,
  findAll,
  save,
  remove,
  includeDiscountsOnShop,
};

export default shopService;
