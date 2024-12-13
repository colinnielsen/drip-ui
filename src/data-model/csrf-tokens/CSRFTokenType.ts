import { UUID } from 'crypto';

export type CSRFToken = {
  id: UUID;
  userId: UUID;
  token: UUID;
};
