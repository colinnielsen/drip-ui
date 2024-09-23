import { createSessionUser } from '@/data-model/user/UserDTO';
import { SavedUser, SessionUser, User } from '@/data-model/user/UserType';
import { sql } from '@vercel/postgres';
import { UUID } from 'node:crypto';

const findById = async <U extends User['__type']>(id: UUID, type?: U) => {
  const result = await sql`SELECT * FROM users WHERE id = ${id}`;
  const maybeUser = result.rows[0] as User | null;
  if (!maybeUser) return null;
  if (type && maybeUser.__type !== type) throw Error('user type mismatch');

  return maybeUser as
    | (U extends 'session' ? SessionUser : U extends 'user' ? SavedUser : User)
    | null;
};

const findByAuthServiceId = async (id: string): Promise<User | null> => {
  const result =
    await sql`SELECT * FROM users WHERE "authServiceId"->>'id' = ${id}`;
  const maybeUser = result.rows[0];
  return maybeUser as User | null;
};

const save = async <T extends User>(user: T): Promise<T> => {
  await sql`
      INSERT INTO "users" (id, __type, role, "authServiceId", wallet, "createdAt")
      VALUES (${user.id}, ${user.__type}, ${user.role}, ${JSON.stringify(user.authServiceId)}, ${JSON.stringify(user.wallet)}, ${user.createdAt})
          ON CONFLICT (id) DO UPDATE SET
            __type = EXCLUDED.__type,
            role = EXCLUDED.role,
            "authServiceId" = EXCLUDED."authServiceId",
            wallet = EXCLUDED.wallet,
            "createdAt" = EXCLUDED."createdAt"
        `;
  return user;
};

const deleteUser = async (id: UUID): Promise<void> => {
  const result = await sql`DELETE FROM users WHERE id = ${id} RETURNING *`;
  if (result.rowCount === 0) throw Error('could not delete');
};

const migrate = async ({
  prevId,
  newId,
}: {
  prevId: UUID;
  newId: UUID;
}): Promise<User> => {
  const prevUser = await findById(prevId);
  if (!prevUser) throw Error('not found');

  const user = await save({ ...prevUser, id: newId });
  await deleteUser(prevId).catch(() => {});
  return user;
};

const getOrCreateSessionUser = async (id: UUID): Promise<SessionUser> => {
  const existingUser = await findById(id);
  if (existingUser && existingUser.__type === 'session') return existingUser;

  return save(createSessionUser(id));
};

//
//// SERVICE OBJECT
///

const userService = {
  findById,
  findByAuthServiceId,
  save,
  deleteUser,
  migrate,
  getOrCreateSessionUser,
};

export default userService;
