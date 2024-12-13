import { err, isUUID } from '@/lib/utils';
import { CSRFToken } from './CSRFTokenType';

export const mapSQLQueriedCSRFTokenToCSRFToken = (queried: any): CSRFToken => {
  const { id, user_id, token } = queried;
  return {
    id: isUUID(id)
      ? id
      : err('mapQueriedCSRFTokenToCSRFToken: id is not valid UUID'),
    userId: isUUID(user_id)
      ? user_id
      : err('mapQueriedCSRFTokenToCSRFToken: user_id is not valid UUID'),
    token: isUUID(token)
      ? token
      : err('mapQueriedCSRFTokenToCSRFToken: token is not valid UUID'),
  };
};
