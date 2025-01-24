import { Item } from '@/data-model/item/ItemType';
import { sql } from '@vercel/postgres';

const findById = async (id: Item['id']): Promise<Item | null> => {
  const result = await sql`SELECT * FROM items WHERE id = ${id}`;
  return result.rows[0] as Item | null;
};

const findAll = async (): Promise<Item[]> => {
  const result = await sql`SELECT * FROM items`;
  return result.rows as Item[];
};

const save = async (item: Item): Promise<Item> => {
  const {
    rows: [savedItem],
  } = await sql`
    INSERT INTO items (id, name, description, image, category, variants, mods)
    VALUES (${item.id}, ${item.name}, ${item.description}, ${item.image}, ${item.category}, ${JSON.stringify(item.variants)}, ${JSON.stringify(item.mods)})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      image = EXCLUDED.image,
      category = EXCLUDED.category,
      variants = EXCLUDED.variants,
      mods = EXCLUDED.mods
    RETURNING *
  `;

  return savedItem as Item;
};

const deleteItem = async (id: Item['id']): Promise<void> => {
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
