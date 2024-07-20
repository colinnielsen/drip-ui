import { Unsaved } from '@/data-model/_common/type/CommonType';
import { PrivyDID } from '@/data-model/_external/privy';
import { mapToSessionUser } from '@/data-model/user/UserDTO';
import { UserRepository } from '@/data-model/user/UserRepository';
import { SavedUser, SessionUser, User } from '@/data-model/user/UserType';
import { UUID } from 'crypto';
import { JSONRepository } from './JSONRepository';

const FILE_PATH = 'users.json';

export class JSONUserRepository
  extends JSONRepository<User>
  implements UserRepository
{
  constructor() {
    super(FILE_PATH);
  }

  async findById<U extends User['__type']>(id: UUID, type?: U) {
    const data = await this.readFromFile();
    const maybeUser = data[id];
    if (!maybeUser) return null;
    if (type && maybeUser.__type !== type) throw Error('user type mismatch');

    return maybeUser as U extends 'session'
      ? SessionUser
      : U extends 'user'
        ? SavedUser
        : User;
  }

  async findByPrivyId(id: PrivyDID) {
    const data = await this.readFromFile();
    const maybeUser = Object.values(data).find(
      user => user.authServiceId?.id === id,
    );
    return maybeUser ?? null;
  }

  async getOrCreateSessionUser(sessionId: UUID): Promise<SessionUser> {
    const existingUser = await this.findById(sessionId);
    if (existingUser && existingUser.__type === 'session') return existingUser;
    return this.save(mapToSessionUser(sessionId));
  }

  async save<T extends User>(user: T): Promise<T> {
    const data = await this.readFromFile();
    data[user.id] = user;
    await this.writeToFile(data);
    return user;
  }

  async update(id: UUID, newUser: Partial<Unsaved<User>>): Promise<User> {
    const data = await this.readFromFile();
    const user = data[id];
    if (!user) throw Error('not found');

    for (const key in newUser) {
      if (newUser.hasOwnProperty(key)) {
        (user as any)[key] = (newUser as any)[key];
      }
    }

    data[id] = user;
    await this.writeToFile(data);
    return user;
  }

  async delete(id: UUID): Promise<void> {
    const data = await this.readFromFile();
    if (!data[id]) throw Error('could not delete');
    delete data[id];
    await this.writeToFile(data);
  }
}
