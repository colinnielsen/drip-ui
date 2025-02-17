import { getSquareAppId } from '@/lib/constants';
import { setTempSquareOAuthId } from '@/lib/data-sources/square';
import { ApiRoute } from '@/lib/next';
import { generateUUID, getHostname, getProtocol } from '@/lib/utils';
import { authenticationService } from '@/services/AuthenticationService';
import { CSRFTokenService } from '@/services/CSRFTokenService';
import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'node:path';

export const getCallbackUrl = () => {
  return (
    `${getProtocol()}://${getHostname()}/` +
    join('api', 'square', 'square-callback')
  );
};

const SQUARE_AUTH_SCOPES = [
  'ITEMS_READ',
  'ORDERS_READ',
  'ORDERS_WRITE',
  'PAYMENTS_WRITE',
  'MERCHANT_PROFILE_READ',
] as const;

/**
 * @dev redirects the user to the generated authorization url
 */
export default ApiRoute(async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const user = await authenticationService.checkAuthentication_sync(req, res);
  if (!user) return res.status(401).json({ error: 'User not found' });

  // generate a CSRF token
  const CSRFToken = await CSRFTokenService.save({
    userId: user.id,
    token: generateUUID(),
  });

  // hash the token to get the a secure state var
  const state = CSRFTokenService.hashToStateParam(CSRFToken);

  const url = new URL('https://connect.squareup.com/oauth2/authorize');

  url.searchParams.append('client_id', getSquareAppId());
  url.searchParams.append('scope', SQUARE_AUTH_SCOPES.join(' '));
  url.searchParams.append('session', 'false');
  url.searchParams.append('state', state);
  url.searchParams.append('redirect_uri', getCallbackUrl());

  setTempSquareOAuthId({ tempOAuthId: user.id, res });

  return res.redirect(url.toString());
}, 'square-authorization-redirect');
