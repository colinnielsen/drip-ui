import { NextApiRequest, NextApiResponse } from 'next';
import { UUID } from 'crypto';
import { generateUUID, isProd } from './utils';

export const SESSION_COOKIE_NAME = 'session_id';
export const PRIVY_TOKEN_NAME = 'privy-token';

export const retreiveOrGenerateSessionId = (
  req: NextApiRequest,
  res: NextApiResponse,
): UUID => {
  let sessionId = req.cookies[SESSION_COOKIE_NAME] as UUID | undefined;

  if (sessionId && sessionId !== ('null' as any)) return sessionId;

  sessionId = generateUUID();
  const isProduction = isProd();

  const cookieOptions = [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    'Path=/',
    'HttpOnly', // TODO is this dangerous
    'SameSite=Strict',
  ];
  if (isProduction) cookieOptions.push('Secure');

  res.setHeader('Set-Cookie', cookieOptions.join('; '));

  return sessionId;
};
