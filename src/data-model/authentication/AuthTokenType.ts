import { Brand } from 'effect';
import { User } from '../user/UserType';

// Branded types for tokens to prevent mixing them up
export type JWTString = string & Brand.Brand<'JWT'>;
export const JWTString = Brand.nominal<JWTString>();

// Access token payload
export type AccessToken = {
  type: 'access';
  /** User ID */
  sub: User['id'];
  /** When the token was issued */
  iat: number;
  /** When the token expires */
  exp: number;
};

// Refresh token payload with additional security fields
export type RefreshToken = {
  type: 'refresh';
  /** User ID */
  sub: User['id'];
  /** Unique token identifier for revocation */
  jti: string;
  /** Token family for detecting reuse */
  family: string;
  /** When the token was issued */
  iat: number;
  /** When the token expires */
  exp: number;
};

//
//// CONFIG
///
export const TOKEN_CONFIG = {
  access: {
    /** 1 day */
    expiresIn: 1 * 24 * 60 * 60,
    cookie: {
      name: 'access_token',
      path: '/api',
    },
  },
  refresh: {
    /** 30 days */
    expiresIn: 30 * 24 * 60 * 60,
    cookie: {
      name: 'refresh_token',
      path: '/api',
    },
  },
} as const;
