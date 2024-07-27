import { UUID } from 'crypto';
import { SavedUser, User } from './UserType';
import { Unsaved } from '../_common/type/CommonType';

export type UserRepository = {
  findById: (userId: UUID) => Promise<User | null>;
  /**
   * @dev finds a User by whatever external auth service is linked to their account
   */
  findByAuthServiceId: (authServiceId: string) => Promise<User | null>;
  /**
   * @dev creates a new User
   */
  save: (data: User) => Promise<User>;
  /**
   * @dev updates an User
   */
  update: (id: UUID, data: Partial<Unsaved<User>>) => Promise<User>;
  /**
   * @dev deletes an User
   * @throws if User is not `pending`
   */
  delete: (userId: UUID) => Promise<void>;
  /**
   * @dev migrates a user from one device to another
   */
  migrate: ({ prevId, newId }: { prevId: UUID; newId: UUID }) => Promise<User>;
};
