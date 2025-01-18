import { UUID } from '@/data-model/_common/type/CommonType';

export type CSRFToken = {
  id: UUID;
  userId: UUID;
  token: UUID;
};
