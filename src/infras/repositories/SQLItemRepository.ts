import { Unsaved } from '@/data-model/_common/type/CommonType';
import { Item } from '@/data-model/item/ItemType';
import { UUID } from 'crypto';
import { sql } from '@vercel/postgres';
import { ItemRepository } from '@/data-model/item/ItemRepository';
import { v4 } from 'uuid';

export class SQLItemRepository implements ItemRepository {
  async findById(id: UUID): Promise<Item | null> {
    const result = await sql`SELECT * FROM items WHERE id = ${id}`;
    return result.rows[0] as Item | null;
  }

  async findAll(): Promise<Item[]> {
    const result = await sql`SELECT * FROM items`;
    return result.rows as Item[];
  }

  async save(item: Unsaved<Item>): Promise<Item> {
    const id = v4() as UUID;
    await sql`
      INSERT INTO items (id, "sliceId", name, price, "prettyPrice", "currencyDecimals", currency, description, image, availability, category, mods)
      VALUES (${id}, ${item.sliceId}, ${item.name}, ${item.price}, ${item.prettyPrice}, ${item.currencyDecimals}, ${item.currency}, ${item.description}, ${item.image}, ${item.availability}, ${item.category}, ${JSON.stringify(item.mods)})
      ON CONFLICT (id) DO UPDATE SET
        "sliceId" = EXCLUDED."sliceId",
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        "prettyPrice" = EXCLUDED."prettyPrice",
        "currencyDecimals" = EXCLUDED."currencyDecimals",
        currency = EXCLUDED.currency,
        description = EXCLUDED.description,
        image = EXCLUDED.image,
        availability = EXCLUDED.availability,
        category = EXCLUDED.category,
        mods = EXCLUDED.mods
    `;
    return { ...item, id } as Item;
  }

  async delete(id: UUID): Promise<void> {
    const result = await sql`DELETE FROM items WHERE id = ${id}`;
    if (result.rowCount === 0) throw Error('could not delete');
  }
}
