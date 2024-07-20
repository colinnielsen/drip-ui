import { Unsaved } from '@/data-model/_common/type/CommonType';
import { PrivyDID } from '@/data-model/_external/privy';
import { mapToSessionUser } from '@/data-model/user/UserDTO';
import { UserRepository } from '@/data-model/user/UserRepository';
import { SavedUser, SessionUser, User } from '@/data-model/user/UserType';
import { UUID } from 'crypto';
import { sql } from '@vercel/postgres';

export class SQLUserRepository implements UserRepository {
  async findById<U extends User['__type']>(id: UUID, type?: U) {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`;
    const maybeUser = result.rows[0] as User | null;
    if (!maybeUser) return null;
    if (type && maybeUser.__type !== type) throw Error('user type mismatch');

    return maybeUser as U extends 'session'
      ? SessionUser
      : U extends 'user'
        ? SavedUser
        : User;
  }

  async findByPrivyId(id: PrivyDID) {
    const result =
      await sql`SELECT * FROM users WHERE authServiceId->>'id' = ${id}`;
    const maybeUser = result.rows[0];
    return maybeUser as User | null;
  }

  async getOrCreateSessionUser(sessionId: UUID): Promise<SessionUser> {
    const existingUser = await this.findById(sessionId);

    if (existingUser && existingUser.__type === 'session') return existingUser;
    return this.save(mapToSessionUser(sessionId));
  }

  async save<T extends User>(user: T): Promise<T> {
    await sql`
      INSERT INTO users (id, __type, role, authServiceId, wallet, createdAt)
      VALUES (${user.id}, ${user.__type}, ${user.role}, ${JSON.stringify(user.authServiceId)}, ${JSON.stringify(user.wallet)}, ${user.createdAt})
      ON CONFLICT (id) DO UPDATE SET
        __type = EXCLUDED.__type,
        role = EXCLUDED.role,
        authServiceId = EXCLUDED.authServiceId,
        wallet = EXCLUDED.wallet,
        createdAt = EXCLUDED.createdAt
    `;
    return user as T;
  }

  async update(id: UUID, newUser: Partial<Unsaved<User>>): Promise<User> {
    const existingUser = await this.findById(id);
    if (!existingUser) throw Error('not found');

    const updatedUser = { ...existingUser, ...newUser };
    await this.save(updatedUser as User);
    return updatedUser as User;
  }

  async delete(id: UUID): Promise<void> {
    const result = await sql`DELETE FROM users WHERE id = ${id}`;
    if (result.rowCount === 0) throw Error('could not delete');
  }
}
