import { Client, Environment } from 'square';
import { getSquareAccessToken } from './constants';

export const SQUARE_AUTHORIZATION_ERRORS = [
  'access_denied',
  'invalid_request',
  'obtain_token_error',
  'save_error',
] as const;

export type SquareAuthorizationErrors =
  (typeof SQUARE_AUTHORIZATION_ERRORS)[number];

const getSquareClient = () =>
  new Client({
    bearerAuthCredentials: {
      accessToken: getSquareAccessToken(),
    },
    environment: Environment.Production,
  });

export default getSquareClient;
