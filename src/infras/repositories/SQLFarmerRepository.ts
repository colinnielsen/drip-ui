import { FarmerRepository } from '@/data-model/farmer/FarmerRepository';
import { Farmer } from '@/data-model/farmer/FarmerType';
import { sql } from '@vercel/postgres';
import { UUID } from 'crypto';
import { v4 } from 'uuid';

export class SQLFarmerRepository implements FarmerRepository {
  async findById(id: UUID): Promise<Farmer | null> {
    const result = await sql`SELECT * FROM farmers WHERE id = ${id}`;
    return result.rows[0] as Farmer | null;
  }

  async findAll(): Promise<Farmer[]> {
    const result = await sql`SELECT * FROM farmers`;
    return result.rows as Farmer[];
  }

  async save(farmer: Farmer): Promise<Farmer> {
    const id = farmer.id || (v4() as UUID);

    await sql`
      INSERT INTO farmers (id, name, image, "shortDescription", "infoUrl", "ethAddress")
      VALUES (${id}, ${farmer.name}, ${farmer.image}, ${farmer.shortDescription}, ${farmer.infoUrl}, ${farmer.ethAddress})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        image = EXCLUDED.image,
        "shortDescription" = EXCLUDED."shortDescription",
        "infoUrl" = EXCLUDED."infoUrl",
        "ethAddress" = EXCLUDED."ethAddress"
    `;
    return { ...farmer, id } as Farmer;
  }

  async delete(id: UUID): Promise<void> {
    const result = await sql`DELETE FROM farmers WHERE id = ${id}`;
    if (result.rowCount === 0) throw Error('could not delete');
  }
}
