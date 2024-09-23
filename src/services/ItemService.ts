import { Unsaved } from '@/data-model/_common/type/CommonType';
import { Item } from '@/data-model/item/ItemType';
import { UUID } from 'crypto';
import { sql } from '@vercel/postgres';
import { v4 } from 'uuid';

const findById = async (id: UUID): Promise<Item | null> => {
  const result = await sql`SELECT * FROM items WHERE id = ${id}`;
  return result.rows[0] as Item | null;
};

const findAll = async (): Promise<Item[]> => {
  const result = await sql`SELECT * FROM items`;
  return result.rows as Item[];
};

const save = async (item: Unsaved<Item>): Promise<Item> => {
  const id = v4() as UUID;
  await sql`
    INSERT INTO items (id, name, price, currency, description, image, availability, category, mods, "__sourceConfig")
    VALUES (${id}, ${item.name}, ${JSON.stringify(item.price)}, ${item.currency}, ${item.description}, ${item.image}, ${item.availability}, ${item.category}, ${JSON.stringify(item.mods)}, ${JSON.stringify(item.__sourceConfig)})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      currency = EXCLUDED.currency,
      description = EXCLUDED.description,
      image = EXCLUDED.image,
      availability = EXCLUDED.availability,
      category = EXCLUDED.category,
      mods = EXCLUDED.mods,
      "__sourceConfig" = EXCLUDED."__sourceConfig"
  `;
  return { ...item, id } as Item;
};

const deleteItem = async (id: UUID): Promise<void> => {
  const result = await sql`DELETE FROM items WHERE id = ${id}`;
  if (result.rowCount === 0) throw Error('could not delete');
};

const itemService = {
  findById,
  findAll,
  save,
  delete: deleteItem,
};

export default itemService;
