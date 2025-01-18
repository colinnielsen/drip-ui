import { rehydrateCurrency } from '@/data-model/_common/currency/currencyDTO';
import { OptionalKeys } from '@/data-model/_common/type/CommonType';
import {
  Farmer,
  FarmerMessage,
  FarmerMessageWithUser,
  FarmerPost,
} from '@/data-model/farmer/FarmerType';
import { err, generateUUID } from '@/lib/utils';
import { sql } from '@vercel/postgres';
import { UUID } from '@/data-model/_common/type/CommonType';
import { v4 } from 'uuid';

const mapSavedFarmerMessageToFarmerMessage = (
  row: any,
): FarmerMessageWithUser => {
  return {
    id: row.id,
    farmer: row.farmer ?? err('expectedFarmerId'),
    sendingUser: row.sending_user?.[0] ?? err('expectedSendingUserId'),
    message: row.message ?? null,
    amount: row.amount ? rehydrateCurrency(row.amount) : null,
    createdAt: new Date(row.created_at) ?? err('expectedCreatedAt'),
  };
};

const findById = async (id: UUID): Promise<Farmer | null> => {
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
};

const findAll = async (): Promise<Farmer[]> => {
  const result = await sql`SELECT * FROM farmers`;
  return result.rows as Farmer[];
};

const save = async (farmer: Farmer): Promise<Farmer> => {
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
};

const savePosts = async (posts: FarmerPost[]): Promise<void> => {
  // batch insert posts
  for (const post of posts) {
    await sql`
      INSERT INTO farmerposts (id, "farmer", "title", "content", "images", "createdAt")
      VALUES (${post.id}, ${post.farmer}, ${post.title}, ${post.content}, ${JSON.stringify(post.images)}, ${post.createdAt.toISOString()})
    `;
  }
};

const deleteFarmer = async (id: UUID): Promise<void> => {
  const result = await sql`DELETE FROM farmers WHERE id = ${id}`;
  if (result.rowCount === 0) throw Error('could not delete');
};

const getFarmerMessages = async (
  farmerId: UUID,
  limit: number = 100,
): Promise<FarmerMessageWithUser[]> => {
  const result = await sql`
    SELECT 
      fm.*,
      (
        SELECT json_agg(u.*)
        FROM users u
        WHERE u.id = fm.sending_user
      ) AS "sending_user"
    FROM farmermessages fm
    WHERE fm.farmer = ${farmerId}
    ORDER BY fm.created_at
    DESC LIMIT ${limit}`;

  return result.rows.map(mapSavedFarmerMessageToFarmerMessage);
};

const upsertFarmerMessage = async (
  message: OptionalKeys<FarmerMessage, 'id' | 'createdAt'>,
): Promise<FarmerMessage> => {
  const id = message.id || generateUUID();
  const createdAt = message.createdAt || new Date();
  const amount = message.amount ? rehydrateCurrency(message.amount) : null;
  const result = await sql`
    INSERT INTO farmermessages (id, farmer, sending_user, message, amount, created_at)
    VALUES (${id}, ${message.farmer}, ${message.sendingUser}, ${message.message}, ${amount ? JSON.stringify(amount) : null}, ${createdAt.toISOString()})
    ON CONFLICT (id) DO UPDATE SET
      farmer = EXCLUDED.farmer,
      sending_user = EXCLUDED.sending_user,
      message = EXCLUDED.message,
      amount = EXCLUDED.amount,
      created_at = EXCLUDED.created_at
    RETURNING *
  `;

  return (result.rows[0] ?? err('expectedFarmerMessage')) as FarmerMessage;
};

const farmerService = {
  findById,
  findAll,
  save,
  savePosts,
  delete: deleteFarmer,
  getFarmerMessages,
  upsertFarmerMessage,
};

export default farmerService;
