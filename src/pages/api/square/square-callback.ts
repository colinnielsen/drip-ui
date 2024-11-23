import {
  getSquareAccessToken,
  getSquareAppId,
  getSquareAppSecret,
} from '@/lib/constants';
import { withErrorHandling } from '@/lib/next';
import { getTempSquareOAuthId } from '@/lib/session';
import { getHostname, getProtocol } from '@/lib/utils';
import { SquareService } from '@/services/SquareService';
import axios, { AxiosError } from 'axios';
import { UUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

export const SQUARE_AUTHORIZATION_ERRORS = [
  'access_denied',
  'invalid_request',
  'obtain_token_error',
  'save_error',
] as const;

export type SquareAuthorizationErrors =
  (typeof SQUARE_AUTHORIZATION_ERRORS)[number];

const handleErrorCase = (
  res: NextApiResponse,
  error: SquareAuthorizationErrors,
  message: string,
) => {
  return res.redirect(`/manage?error=${error}&message=${message}`);
};

const handleAllowCase = async (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: UUID,
) => {
  // 1. Parse the parameters that are returned in the seller authorization response.
  const parsed = z
    .object({
      response_type: z.literal('code'),
      code: z.string(),
      state: z.string(),
    })
    .safeParse(req.query);

  if (!parsed.success)
    return handleErrorCase(
      res,
      'invalid_request',
      'failed to parse the authorization response',
    );
  const { code, state } = parsed.data;

  // TODO: verify state token

  // Use the authorization code in the response to call the OAuth API to obtain the seller's access and refresh tokens.
  const result = await axios
    .post<{
      access_token: string;
      token_type: string;
      /**
       * iso 8601 date string
       */
      expires_at: string;
      merchant_id: string;
      refresh_token: string;
      short_lived: boolean;
    }>(
      'https://connect.squareup.com/oauth2/token',
      {
        client_id: getSquareAppId(),
        client_secret: getSquareAppSecret(),
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${getProtocol()}://${getHostname()}/api/square/square-callback`,
      },
      {
        headers: {
          'Square-Version': '2024-10-17',
          Authorization: `Bearer ${getSquareAccessToken()}`,
        },
      },
    )
    .catch(error => error as AxiosError);

  if (result instanceof Error) {
    console.error(result.response);
    return handleErrorCase(
      res,
      'obtain_token_error',
      `Failed to obtain token: ${
        (result.response?.data as any)?.message ??
        (result.response?.data as any)?.errors
          ?.map((e: any) => `${e?.code}: ${e?.detail}`)
          .join(', ') ??
        result.message ??
        'unknown error'
      }`,
    );
  }

  const { access_token, refresh_token, merchant_id, expires_at, token_type } =
    result.data;

  if (token_type !== 'bearer')
    return handleErrorCase(res, 'invalid_request', 'Token type is not bearer');

  // save the encrypted square connection tokens
  const connection = await SquareService.save({
    userId,
    merchantId: merchant_id,
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt: new Date(expires_at),
  }).catch((e: Error) => e);

  if (connection instanceof Error)
    return handleErrorCase(
      res,
      'save_error',
      'Failed to save square connection',
    );

  return res.redirect(`/manage?success=true`);
};

export default withErrorHandling(async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // handle wrong request
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const userId = getTempSquareOAuthId(req);
  if (!userId)
    return res
      .status(400)
      .json({ error: 'session-token not found in cookies' });

  // handle deny auth case
  if (req.query.error === 'access_denied')
    return handleErrorCase(
      res,
      'access_denied',
      'You denied access, please try again',
    );
  // handle allow auth case
  return handleAllowCase(req, res, userId);
}, 'square-callback');
