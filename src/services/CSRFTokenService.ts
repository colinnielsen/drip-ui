import { CSRFToken } from '@/data-model/csrf-tokens/CSRFTokenType';
import SQLCSRFTokenPersistanceLayer from '@/infrastructures/sql/CSRFTokenPersistance';
import { hash } from 'crypto';

const hashToStateParam = (token: CSRFToken) =>
  hash('SHA256', token.token, 'base64url');

export const CSRFTokenService = {
  ...SQLCSRFTokenPersistanceLayer,
  hashToStateParam,
};
