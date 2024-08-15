import { Item, ItemMod } from '@/data-model/item/ItemType';
import { ShopRepository } from '@/data-model/shop/ShopRepository';
import { Shop } from '@/data-model/shop/ShopType';
import { UUID } from 'crypto';
import { sql } from '@vercel/postgres';
import { isStorefront } from '@/data-model/shop/ShopDTO';
import { rehydrateData } from '@/lib/utils';

export class SQLShopRepository implements ShopRepository {
  async findById(id: UUID, { rehydrate = true } = {}): Promise<Shop | null> {
    const result = await sql`SELECT * FROM shops WHERE id = ${id}`;
    const shop = result.rows[0] as Shop | null;

    return shop ? (rehydrate ? this.rehydrateShop(shop) : shop) : null;
  }

  async findAll({ rehydrate = true } = {}): Promise<Shop[]> {
    const result = await sql`SELECT * FROM shops`;
    const shops = result.rows as Shop[];
    return rehydrate ? shops.map(this.rehydrateShop) : shops;
  }

  async findItem(shopId: UUID, nameOrID: UUID | string): Promise<Item | null> {
    const shop = await this.findById(shopId);
    if (!shop) return null;

    const isFindByName = typeof nameOrID === 'string';
    const items = Object.values(shop.menu).flat();

    return (
      items.find(item =>
        isFindByName ? item.name === nameOrID : item.id === nameOrID,
      ) ?? null
    );
  }

  async getItemMods(shopId: UUID, itemId: UUID): Promise<ItemMod[]> {
    const item = await this.findItem(shopId, itemId);
    if (!item) throw Error('findItemMods() > item not found');
    return item.mods;
  }

  async save(shop: Shop): Promise<Shop> {
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
  }

  async delete(id: UUID): Promise<void> {
    const result = await sql`DELETE FROM shops WHERE id = ${id}`;
    if (result.rowCount === 0) throw Error('could not delete');
  }

  private rehydrateShop(shop: Shop): Shop {
    return rehydrateData(shop);
  }
}
