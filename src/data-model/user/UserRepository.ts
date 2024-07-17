import { UUID } from 'crypto';
import { User } from './UserType';
import { Unsaved } from '../_common/type/CommonType';

export type UserRepository = {
  findById: (userId: UUID) => Promise<User | null>;
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
};
