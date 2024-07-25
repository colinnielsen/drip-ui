import { Item, ItemMod } from '@/data-model/item/ItemType';
import { ShopRepository } from '@/data-model/shop/ShopRepository';
import { Shop } from '@/data-model/shop/ShopType';
import { UUID } from 'crypto';
import { sql } from '@vercel/postgres';
import { isStorefront } from '@/data-model/shop/ShopDTO';

export class SQLShopRepository implements ShopRepository {
  async findById(id: UUID): Promise<Shop | null> {
    const result = await sql`SELECT * FROM shops WHERE id = ${id}`;
    return result.rows[0] as Shop | null;
  }

  async findAll(): Promise<Shop[]> {
    const result = await sql`SELECT * FROM shops`;
    return result.rows as Shop[];
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
      INSERT INTO shops (id, __type, label, "backgroundImage", logo, "farmerAllocations", menu, "bestSellers", "__sourceConfig", location)
      VALUES (${shop.id}, ${shop.__type}, ${shop.label}, ${shop.backgroundImage}, ${shop.logo}, ${JSON.stringify(shop.farmerAllocations)}, ${JSON.stringify(shop.menu)}, ${JSON.stringify(shop.bestSellers)}, ${JSON.stringify(shop.__sourceConfig)}, ${isStorefront(shop) ? JSON.stringify(shop.location) : null})
      ON CONFLICT (id) DO UPDATE SET
        __type = EXCLUDED.__type,
        "__sourceConfig" = EXCLUDED."__sourceConfig",
         label = EXCLUDED.label,
        "backgroundImage" = EXCLUDED."backgroundImage",
        logo = EXCLUDED.logo,
        url = EXCLUDED.url,
        "farmerAllocations" = EXCLUDED."farmerAllocations",
        menu = EXCLUDED.menu,
        "bestSellers" = EXCLUDED."bestSellers",
        location = EXCLUDED.location
    `;
    return shop;
  }

  async delete(id: UUID): Promise<void> {
    const result = await sql`DELETE FROM shops WHERE id = ${id}`;
    if (result.rowCount === 0) throw Error('could not delete');
  }
}
