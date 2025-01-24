import {
  getSquareAccessToken,
  getSquareAppId,
  getSquareAppSecret,
} from '@/lib/constants';
import { ApiRoute } from '@/lib/next';
import { getTempSquareOAuthId } from '@/lib/session';
import getSquareClient, { SquareAuthorizationErrors } from '@/lib/squareClient';
import { getHostname, getProtocol } from '@/lib/utils';
import { CSRFTokenService } from '@/services/CSRFTokenService';
import { SquareService } from '@/services/SquareService';
import axios, { AxiosError } from 'axios';
import { UUID } from '@/data-model/_common/type/CommonType';
import { NextApiRequest, NextApiResponse } from 'next';
import * as S from 'effect/Schema';

const SquareCallbackSchema = S.Struct({
  response_type: S.Literal('code'),
  code: S.String,
  state: S.String,
});

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
  const parsed = S.decodeUnknownOption(SquareCallbackSchema)(req.query);

  if (parsed._tag === 'None')
    return handleErrorCase(
      res,
      'invalid_request',
      'failed to parse the authorization response',
    );

  const { code, state } = parsed.value;

  const CSRFToken = await CSRFTokenService.findByUserId(userId);

  if (!CSRFToken)
    return handleErrorCase(
      res,
      'invalid_request',
      'No CSRF token found for this user',
    );

  const expectedState = CSRFTokenService.hashToStateParam(CSRFToken);

  if (state !== expectedState)
    return handleErrorCase(res, 'access_denied', 'Invalid CSRF token');

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

  const squareClient = getSquareClient().withConfiguration({
    bearerAuthCredentials: {
      accessToken: access_token,
    },
  });

  // save the encrypted square connection tokens
  const connection = await SquareService.save({
    userId,
    merchantId: merchant_id,
    businessName: await squareClient.merchantsApi
      .retrieveMerchant(merchant_id)
      .then(m => m.result.merchant?.businessName || ''),
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
  else return res.redirect(`/manage?success=true`);
};

export default ApiRoute(async function handler(
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
