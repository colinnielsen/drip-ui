import { UUID } from '@/data-model/_common/type/CommonType';
import {
  deriveShopConfigIdFromExternalId,
  isStorefront,
  mapShopSourceConfigToExternalId,
} from '@/data-model/shop/ShopDTO';
import { Shop, ShopConfig, ShopExternalId } from '@/data-model/shop/ShopType';
import { createEffectService } from '@/lib/effect';
import { rehydrateData } from '@/lib/utils';
import { sql } from '@vercel/postgres';

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
  const result = await sql`
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
      "farmerAllocations" = EXCLUDED."farmerAllocations",
      menu = EXCLUDED.menu,
      location = EXCLUDED.location,
      "tipConfig" = EXCLUDED."tipConfig"
    RETURNING *
  `;
  return result.rows[0] as Shop;
};

const remove = async (id: UUID): Promise<void> => {
  const result = await sql`DELETE FROM shops WHERE id = ${id}`;
  if (result.rowCount === 0) throw Error('could not delete');
};

const _rehydrate = (shop: Shop): Shop => {
  return rehydrateData(shop);
};

// /**
//  * @dev takes a shop and returns the shop with the `discountPrice` field set on the menu items
//  * based on the current user's wallet address and current shop discounts
//  */
// export const includeDiscountsOnShop = async (
//   shop: Shop,
//   {
//     walletAddress,
//     userId,
//   }: { walletAddress: Address | undefined; userId: string | undefined },
// ): Promise<Shop> => {
//   // no op for other store types
//   if (shop.__sourceConfig.type !== 'slice') return shop;

//   const slicerId = getSlicerIdFromSliceExternalId(shop.__sourceConfig.id);
//   console.debug('slicerId', slicerId);
//   const { cartProducts } = await sliceKit
//     .getStoreProducts({
//       slicerId,
//       buyer: walletAddress,
//     })
//     .catch(err => {
//       console.error('error getting store products', err);
//       return { cartProducts: [] };
//     });

//   const discountedItemById = cartProducts
//     .map(mapSliceProductCartToItem)
//     .reduce<Record<UUID, Item>>(
//       (acc, item) => ({
//         ...acc,
//         [item.id]: item,
//       }),
//       {},
//     );

//   return {
//     ...shop,
//     menu: Object.entries(shop.menu).reduce<Shop['menu']>(
//       (acc, [category, items]) => ({
//         ...acc,
//         [category satisfies ItemCategory]: items.map(item => ({
//           ...item,
//           discountPrice: discountedItemById[item.id]?.variants[0].price || undefined,
//         })),
//       }),
//       EMPTY_MENU,
//     ),
//   };
// };

export const saveShopConfig = async (
  config: Omit<ShopConfig, 'id'>,
): Promise<ShopConfig> => {
  const result = await sql`
    INSERT INTO shop_configs (
      id,
      __type,
      "externalId",
      name,
      location,
      logo,
      "backgroundImage",
      url,
      "farmerAllocation",
      "fundRecipientConfig",
      "tipConfig"
    )
    VALUES (
      ${deriveShopConfigIdFromExternalId(config)},
      ${config.__type},
      ${config.externalId},
      ${config.name},
      ${JSON.stringify(config.location)},
      ${config.logo},
      ${config.backgroundImage},
      ${config.url},
      ${JSON.stringify(config.farmerAllocation)},
      ${'fundRecipientConfig' in config ? JSON.stringify(config.fundRecipientConfig) : null},
      ${'tipConfig' in config ? JSON.stringify(config.tipConfig) : null}
    )
    ON CONFLICT (id) DO UPDATE SET
      __type = EXCLUDED.__type,
      "externalId" = EXCLUDED."externalId",
      name = EXCLUDED.name,
      location = EXCLUDED.location,
      logo = EXCLUDED.logo,
      "backgroundImage" = EXCLUDED."backgroundImage",
      url = EXCLUDED.url,
      "farmerAllocation" = EXCLUDED."farmerAllocation",
      "fundRecipientConfig" = EXCLUDED."fundRecipientConfig",
      "tipConfig" = EXCLUDED."tipConfig"
    RETURNING *
  `;
  return result.rows[0] as ShopConfig;
};

const findAllShopConfigs = async (): Promise<ShopConfig[]> => {
  const result = await sql`SELECT * FROM shop_configs`;
  return result.rows as ShopConfig[];
};

const findShopConfigById = async (id: UUID): Promise<ShopConfig | null> => {
  const result = await sql`SELECT * FROM shop_configs WHERE id = ${id}`;
  return result.rows[0] as ShopConfig | null;
};

const findShopConfigByExternalId = async (
  externalId: ShopExternalId,
): Promise<ShopConfig | null> => {
  const result =
    await sql`SELECT * FROM shop_configs WHERE "externalId" = ${externalId}`;
  return result.rows[0] as ShopConfig | null;
};

const findShopConfigByShopId = async (
  shopId: Shop['id'],
): Promise<ShopConfig | null> => {
  const shop = await findById(shopId);
  if (!shop) return null;
  const shopConfig = await findShopConfigByExternalId(
    mapShopSourceConfigToExternalId(shop.__sourceConfig),
  );
  if (!shopConfig) return null;

  return shopConfig;
};

const findSquareShopConfigsByMerchantId = async (
  merchantId: string,
): Promise<ShopConfig[]> => {
  const result =
    await sql`SELECT * FROM shop_configs WHERE "externalId" LIKE ${`%${merchantId}%::%`}`;
  return result.rows as ShopConfig[];
};

//
//// SERVICE OBJECT
///
const shopService = {
  findById,
  findAll,
  save,
  saveShopConfig,
  findAllShopConfigs,
  findShopConfigById,
  findShopConfigByExternalId,
  findShopConfigByShopId,
  findSquareShopConfigsByMerchantId,
  remove,
};

export default shopService;

export const effectfulShopService = createEffectService(shopService);
