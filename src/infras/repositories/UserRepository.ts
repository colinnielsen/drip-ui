// src/infrastructure/repositories/implementations/InMemoryStoreRepository.ts
import { FAKE_DB_SLEEP_MS } from '@/data-model/__global/constants';
import { Unsaved } from '@/data-model/_common/type/CommonType';
import { UserRepository } from '@/data-model/user/UserRepository';
import {
  TESTING_USER,
  TESTING_USER_UUID,
  User,
} from '@/data-model/user/UserType';
import { sleep } from '@/lib/utils';
import { UUID } from 'crypto';
import { v4 } from 'uuid';

export class InMemoryUserRepository implements UserRepository {
  private items: Map<UUID, User> = new Map();

  constructor() {
    this.items = new Map();
    this.items.set(TESTING_USER_UUID, TESTING_USER);
  }

  async findById(id: UUID): Promise<User | null> {
    await sleep(FAKE_DB_SLEEP_MS);
    return this.items.get(id) || null;
  }

  async save(data: Unsaved<User>): Promise<User> {
    const id = v4() as UUID;
    const user: User = {
      id,
      ...data,
    };

    await sleep(FAKE_DB_SLEEP_MS);
    this.items.set(id, user);

    return user;
  }

  async update(id: UUID, newUser: Partial<Unsaved<User>>): Promise<User> {
    const existingUser = this.items.get(id);
    if (!existingUser) throw Error('not found');

    const nextUser = { ...existingUser, d: newUser };
    this.items.set(id, nextUser);

    await sleep(FAKE_DB_SLEEP_MS);

    return nextUser;
  }

  async delete(id: UUID): Promise<void> {
    await sleep(FAKE_DB_SLEEP_MS);
    if (!this.items.delete(id)) throw Error('could not delete');
  }
}
