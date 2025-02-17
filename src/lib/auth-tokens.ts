import { UUID } from '@/data-model/_common/type/CommonType';
import {
  JWTString,
  TOKEN_CONFIG,
} from '@/data-model/authentication/AuthTokenType';
import { PRIVY_TOKEN_NAME } from '@/lib/privy';
import { isProd } from '@/lib/utils';
import { Effect, Option } from 'effect';
import { NextApiRequest, NextApiResponse } from 'next';
import { UnauthorizedError } from './effect';
import { isUUID } from './utils';

//
//// HELPERS
export const getJWTCookie = (req: NextApiRequest, type: 'access' | 'refresh') =>
  Effect.suspend(() =>
    !!req.cookies[TOKEN_CONFIG[type].cookie.name]
      ? Effect.succeed(JWTString(req.cookies[TOKEN_CONFIG[type].cookie.name]!))
      : Effect.fail(new UnauthorizedError('No valid tokens found')),
  );

export const getPrivyToken = (req: NextApiRequest) =>
  Effect.succeed(
    Option.fromNullable(req.cookies[PRIVY_TOKEN_NAME]).pipe(
      Option.map(JWTString),
    ),
  );

export const setAuthCookies = (
  res: NextApiResponse,
  accessToken: JWTString,
  refreshToken: JWTString,
) => {
  const cookieHeaders = [
    // Access token cookie
    [
      `${TOKEN_CONFIG.access.cookie.name}=${accessToken}`,
      'HttpOnly',
      `Path=${TOKEN_CONFIG.access.cookie.path}`,
      'SameSite=Lax',
      isProd() && 'Secure',
    ]
      .filter(Boolean)
      .join('; '),
    // Refresh token cookie
    [
      `${TOKEN_CONFIG.refresh.cookie.name}=${refreshToken}`,
      'HttpOnly',
      `Path=${TOKEN_CONFIG.refresh.cookie.path}`,
      'SameSite=Lax',
      isProd() && 'Secure',
    ]
      .filter(Boolean)
      .join('; '),
  ];

  res.setHeader('Set-Cookie', cookieHeaders);
};

// Clear auth cookies on logout/error
export const clearAuthCookies = (res: NextApiResponse) => {
  const cookieHeaders = [
    [
      `${TOKEN_CONFIG.access.cookie.name}=`,
      `Path=${TOKEN_CONFIG.access.cookie.path}`,
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ].join('; '),
    [
      `${TOKEN_CONFIG.refresh.cookie.name}=`,
      `Path=${TOKEN_CONFIG.refresh.cookie.path}`,
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ].join('; '),
  ];

  res.setHeader('Set-Cookie', cookieHeaders);
};
