import { FarmerRepository } from '@/data-model/farmer/FarmerRepository';
import { Farmer, FarmerPosts } from '@/data-model/farmer/FarmerType';
import { sql } from '@vercel/postgres';
import { UUID } from 'crypto';
import { v4 } from 'uuid';

export class SQLFarmerRepository implements FarmerRepository {
  async findById(id: UUID): Promise<Farmer | null> {
    const result = await sql`
      SELECT 
        f.*,
        (
          SELECT json_agg(fp.*)
          FROM farmerposts fp
          WHERE fp.farmer = f.id
        ) AS posts
      FROM farmers f
      WHERE f.id = ${id}
    `;

    if (result.rows.length === 0) return null;

    const farmerData = result.rows[0];
    return {
      ...farmerData,
      posts: farmerData.posts || [],
    } as Farmer;
  }

  async findAll(): Promise<Farmer[]> {
    const result = await sql`SELECT * FROM farmers`;
    return result.rows as Farmer[];
  }

  async save(farmer: Farmer): Promise<Farmer> {
    const id = farmer.id || (v4() as UUID);

    await sql`
      INSERT INTO farmers (id, name, image, pfp, "shortDescription", bio, "bioImages", "infoUrl", "ethAddress")
      VALUES (${id}, ${farmer.name}, ${farmer.image}, ${farmer.pfp}, ${farmer.shortDescription}, ${farmer.bio}, ${JSON.stringify(farmer.bioImages)}, ${farmer.infoUrl}, ${farmer.ethAddress})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        image = EXCLUDED.image,
        pfp = EXCLUDED.pfp,
        "shortDescription" = EXCLUDED."shortDescription",
        bio = EXCLUDED.bio,
        "bioImages" = EXCLUDED."bioImages",
        "infoUrl" = EXCLUDED."infoUrl",
        "ethAddress" = EXCLUDED."ethAddress"
    `;
    return { ...farmer, id } as Farmer;
  }

  async savePosts(posts: FarmerPosts[]): Promise<void> {
    // batch insert posts
    for (const post of posts) {
      await sql`
        INSERT INTO farmerposts (id, "farmer", "title", "content", "image", "createdAt")
        VALUES (${post.id}, ${post.farmer}, ${post.title}, ${post.content}, ${post.image}, ${post.createdAt.toISOString()})
      `;
    }
  }

  async delete(id: UUID): Promise<void> {
    const result = await sql`DELETE FROM farmers WHERE id = ${id}`;
    if (result.rowCount === 0) throw Error('could not delete');
  }
}
