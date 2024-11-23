import { getSquareAppId } from '@/lib/constants';
import { withErrorHandling } from '@/lib/next';
import { getSessionId, setTempSquareOAuthId } from '@/lib/session';
import { generateUUID, getHostname, getProtocol } from '@/lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'node:path';

export const getCallbackUrl = () => {
  return (
    `${getProtocol()}://${getHostname()}/` +
    join('api', 'square', 'square-callback')
  );
};

/**
 * @dev redirects the user to the generated authorization url
 */
export default withErrorHandling(async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const sessionId = getSessionId(req);
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });
  if (!sessionId)
    return res.status(401).json({ error: 'No session id found in cookies' });

  // generate a CSRF token
  const state = generateUUID();

  const url = new URL('https://connect.squareup.com/oauth2/authorize');

  url.searchParams.append('client_id', getSquareAppId());
  url.searchParams.append('scope', 'ITEMS_READ ORDERS_WRITE');
  url.searchParams.append('session', 'false');
  url.searchParams.append('state', state);
  url.searchParams.append('redirect_uri', getCallbackUrl());

  setTempSquareOAuthId({ tempOAuthId: sessionId, res });

  return res.redirect(url.toString());
}, 'square-authorization-redirect');
