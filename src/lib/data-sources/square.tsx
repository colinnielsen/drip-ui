import { NextApiRequest, NextApiResponse } from 'next';
import { UUID } from 'node:crypto';
import { Client, Environment } from 'square';
import { getSquareAccessToken } from '../constants';
import { isUUID } from '../utils';

//
//// HELPERS
///
export const TEMP_OAUTH_COOKIE_NAME = 'temp_oauth_id';

export const setTempSquareOAuthId = ({
  tempOAuthId,
  res,
}: {
  tempOAuthId: UUID;
  res: NextApiResponse;
}): UUID => {
  const OAuthCookieOptions = [
    `${TEMP_OAUTH_COOKIE_NAME}=${tempOAuthId}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  res.setHeader('Set-Cookie', OAuthCookieOptions.join('; '));

  return tempOAuthId;
};

export const getTempSquareOAuthId = (req: NextApiRequest): UUID | null => {
  const tempOAuthId = req.cookies[TEMP_OAUTH_COOKIE_NAME];
  if (!tempOAuthId) return null;
  if (!isUUID(tempOAuthId)) throw new Error('Invalid temp oauth cookie');

  return tempOAuthId;
};

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
