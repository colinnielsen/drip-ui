import { Unsaved } from '@/data-model/_common/type/CommonType';
import { Item } from '@/data-model/item/ItemType';
import { UUID } from '@/data-model/_common/type/CommonType';
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
    INSERT INTO items (id, name, description, image, category, variants, mods)
    VALUES (${id}, ${item.name}, ${item.description}, ${item.image}, ${item.category}, ${JSON.stringify(item.variants)}, ${JSON.stringify(item.mods)})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      image = EXCLUDED.image,
      category = EXCLUDED.category,
      variants = EXCLUDED.variants,
      mods = EXCLUDED.mods
  `;
  return { ...item, id } satisfies Item;
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
