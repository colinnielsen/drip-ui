import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { isProd, isUUID } from './utils';

export const SESSION_COOKIE_NAME = 'session_id';
export const TEMP_OAUTH_COOKIE_NAME = 'temp_oauth_id';
export const PRIVY_TOKEN_NAME = 'privy-token';

export const setSessionId = (sessionId: UUID, res: NextApiResponse): UUID => {
  const isProduction = isProd();

  const cookieOptions = [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    'Path=/',
    'HttpOnly', // TODO is this dangerous?
    'SameSite=Strict',
  ];
  if (isProduction) cookieOptions.push('Secure');

  res.setHeader('Set-Cookie', cookieOptions.join('; '));

  return sessionId;
};

/**
 * @throws if session cookie is an invalid uuid
 */
export const getSessionId = (req: NextApiRequest): UUID | null => {
  const sessionCookie = req.cookies[SESSION_COOKIE_NAME];
  if (!sessionCookie) return null;

  // TODO: add validation
  if (!isUUID(sessionCookie)) throw new Error('Invalid session cookie');

  return sessionCookie;
};

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
