import {
  AccessToken,
  JWTString,
  RefreshToken,
  TOKEN_CONFIG,
} from '@/data-model/authentication/AuthTokenType';
import { mapToUser } from '@/data-model/user/UserDTO';
import { User } from '@/data-model/user/UserType';
import {
  clearAuthCookies,
  getJWTCookie,
  getPrivyToken,
  setAuthCookies,
} from '@/lib/auth-tokens';
import {
  BadRequestError,
  BaseEffectError,
  existsOrNotFoundErr,
  GenericError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/effect';
import { BASE_CLIENT } from '@/lib/ethereum';
import privy from '@/lib/privy';
import { AuthTokenClaims } from '@privy-io/server-auth';
import { Console, Effect, Option, pipe } from 'effect';
import { jwtVerify, JWTVerifyResult, SignJWT } from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';
import { Hex } from 'viem';
import { parseSiweMessage } from 'viem/siwe';
import { effectfulUserService } from './UserService';

// CONSTANTS
////

const getJWTSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error(`JWT_SECRET not set`);

  return new TextEncoder().encode(secret);
};

//
//// ERRORS
export class AuthenticationError extends BaseEffectError {
  readonly _tag = 'AuthenticationError';
}

export class TokenVerificationError extends BaseEffectError {
  readonly _tag = 'TokenVerificationError';
}

export class ExpiredTokenError extends BaseEffectError {
  readonly _tag = 'ExpiredTokenError';
}

export class InvalidTokenError extends BaseEffectError {
  readonly _tag = 'InvalidTokenError';
}

export class TokenCreationError extends BaseEffectError {
  readonly _tag = 'TokenCreationError';
}

//
//// TOKEN VERIFICATION
///
const _verifyJWT = (
  token: JWTString,
): Effect.Effect<
  JWTVerifyResult<AccessToken | RefreshToken>,
  TokenVerificationError,
  never
> => {
  return pipe(
    Effect.tryPromise({
      try: () =>
        jwtVerify<RefreshToken | AccessToken>(token, getJWTSecret(), {
          currentDate: new Date(),
        }).then(b => b),
      catch: e => new TokenVerificationError((e as Error).message),
    }),
  );
};

const verifyPrivyToken = (
  privyToken: JWTString,
): Effect.Effect<
  AuthTokenClaims,
  TokenVerificationError | NotFoundError | GenericError
> =>
  pipe(
    // pipe over the privy token
    privyToken,
    // verify the token
    pt =>
      Effect.tryPromise({
        try: async () => await privy.verifyAuthToken(pt),
        catch: e => new TokenVerificationError(e as Error),
      }),
  );

//
//// TOKEN ISSUANCE
///
const issueAccessToken = (
  userId: User['id'],
): Effect.Effect<
  { token: AccessToken; tokenString: JWTString },
  TokenCreationError
> =>
  Effect.tryPromise({
    try: async () => {
      const iat = Math.floor(Date.now() / 1000); // issued at timestamp
      const exp = iat + TOKEN_CONFIG.access.expiresIn; // expiration timestamp

      const token: AccessToken = {
        type: 'access',
        sub: userId,
        iat,
        exp,
      };
      // sign the new access token
      const tokenString = await new SignJWT(token)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(getJWTSecret());

      return {
        token,
        tokenString: JWTString(tokenString),
      };
    },
    catch: e => new TokenCreationError((e as Error).message),
  });

const issueRefreshToken = (
  userId: User['id'],
  family: string,
): Effect.Effect<
  { token: RefreshToken; tokenString: JWTString },
  TokenCreationError
> =>
  Effect.tryPromise({
    try: async () => {
      const iat = Math.floor(Date.now() / 1000); // issued at timestamp
      const exp = iat + TOKEN_CONFIG.refresh.expiresIn; // expiration timestamp

      const token: RefreshToken = {
        type: 'refresh',
        sub: userId,
        jti: crypto.randomUUID(),
        family,
        iat,
        exp,
      };

      const tokenString = await new SignJWT(token)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(getJWTSecret());

      return {
        token,
        tokenString: JWTString(tokenString),
      };
    },
    catch: e => new TokenCreationError((e as Error).message),
  });

// Core authentication functions
const issueRefreshAndAccessToken = (
  userId: User['id'],
): Effect.Effect<
  {
    accessToken: { tokenString: JWTString; token: AccessToken };
    refreshToken: { tokenString: JWTString; token: RefreshToken };
  },
  TokenCreationError
> =>
  pipe(userId, userId =>
    Effect.all(
      {
        accessToken: issueAccessToken(userId),
        refreshToken: issueRefreshToken(userId, crypto.randomUUID()),
      },
      { concurrency: 'unbounded' },
    ),
  );

/**
 *
 * @dev based on a refresh token, generates a new token pair
 */
const issueTokensFromRefreshToken = ({
  refreshToken,
}: {
  refreshToken: JWTString;
}): Effect.Effect<
  {
    accessToken: { tokenString: JWTString; token: AccessToken };
    refreshToken: { tokenString: JWTString; token: RefreshToken };
  },
  | AuthenticationError
  | NotFoundError
  | TokenVerificationError
  | TokenCreationError
  | InvalidTokenError
  | GenericError
> =>
  pipe(
    refreshToken,
    refreshToken => _verifyJWT(refreshToken),
    Effect.andThen(result =>
      result.payload.type !== 'refresh'
        ? Effect.fail(new InvalidTokenError('Not a refresh token'))
        : Effect.succeed(result.payload),
    ),
    Effect.andThen(payload => issueRefreshAndAccessToken(payload.sub)),
  );

/**
 * @dev verifies an access token is valid
 * @param verifyUser can verify a user exists
 */
const verifyAccessToken = ({
  accessToken,
  verifyUser = false,
}: {
  accessToken: JWTString;
  verifyUser?: boolean;
}): Effect.Effect<
  AccessToken,
  InvalidTokenError | NotFoundError | GenericError | TokenVerificationError
> =>
  pipe(
    _verifyJWT(accessToken),
    Effect.andThen(result =>
      result.payload.type !== 'access'
        ? Effect.fail(new InvalidTokenError('Not an access token'))
        : Effect.succeed(result.payload),
    ),
    // run optional existence check
    Effect.tap(payload =>
      verifyUser
        ? effectfulUserService.findById(payload.sub).pipe(existsOrNotFoundErr)
        : Effect.succeed(() => {}),
    ),
  );

//
//// GET USER FROM REQUEST FLOW 1-3

// FLOW 1
// they have an access token
const verifyAccessTokenFlow = (
  accessTokenString: JWTString,
): Effect.Effect<AccessToken, UnauthorizedError, never> =>
  pipe(
    verifyAccessToken({ accessToken: accessTokenString }),
    // if anything fails, we should unauthorize the user
    Effect.catchAll(error => {
      Console.error(error);
      return Effect.fail(new UnauthorizedError('Invalid access token'));
    }),
  );

// FLOW 2
// they have a refresh token but their access token expired
const useRefreshTokenFlow = (
  refreshTokenString: JWTString,
  res: NextApiResponse,
): Effect.Effect<AccessToken, UnauthorizedError, never> =>
  pipe(
    issueTokensFromRefreshToken({ refreshToken: refreshTokenString }),
    // set the auth cookies
    Effect.tap(({ accessToken, refreshToken }) =>
      Effect.sync(() =>
        setAuthCookies(res, accessToken.tokenString, refreshToken.tokenString),
      ),
    ),
    Effect.andThen(({ accessToken: { token } }) => token),
    Effect.catchAll(error => {
      Console.error(error);
      return Effect.fail(new UnauthorizedError(error));
    }),
  );

// FLOW 3
// they have neither somehow, but have a privy token
const verifyPrivyTokenFlow = (
  token: JWTString,
  res: NextApiResponse,
): Effect.Effect<AccessToken, UnauthorizedError, never> =>
  pipe(
    // verify the privy token
    verifyPrivyToken(token),
    Effect.andThen(authTokenClaims =>
      pipe(
        authTokenClaims,
        // find the user based on the auth service id
        authClaims =>
          effectfulUserService
            .findByAuthServiceId(authClaims.userId)
            // or throw not found
            .pipe(existsOrNotFoundErr),
        // if the user is found issue access tokens for the user
        Effect.andThen(user => issueRefreshAndAccessToken(user.id)),
        Effect.tap(({ accessToken, refreshToken }) =>
          //    and set the auth cookies on the response header
          Effect.sync(() =>
            setAuthCookies(
              res,
              accessToken.tokenString,
              refreshToken.tokenString,
            ),
          ),
        ),
        Effect.andThen(({ accessToken }) => accessToken.token),
      ),
    ),
    Effect.catchAll(e => Effect.fail(new UnauthorizedError(e))),
  );

// gets a user from a next request using the above 3 flows
const checkAuthentication = (
  req: NextApiRequest,
  res: NextApiResponse,
): Effect.Effect<User, UnauthorizedError, never> => {
  return pipe(
    req,
    req =>
      Effect.all({
        accessToken: getJWTCookie(req, 'access'),
        refreshToken: getJWTCookie(req, 'refresh'),
        privyToken: getPrivyToken(req),
      }),
    Effect.andThen(({ accessToken, refreshToken, privyToken }) => {
      // Try access token first
      if (accessToken) return verifyAccessTokenFlow(accessToken);
      // then refresh token (and set and issue new refresh / access tokens)
      if (refreshToken) return useRefreshTokenFlow(refreshToken, res);
      // then the privy token
      if (Option.isSome(privyToken))
        return verifyPrivyTokenFlow(privyToken.value, res);

      return Effect.fail(new UnauthorizedError('No valid tokens found'));
    }),
    // see if the user exists, and return out the error
    Effect.andThen(accessToken =>
      effectfulUserService.findById(accessToken.sub).pipe(existsOrNotFoundErr),
    ),
    Effect.andThen(u => u),
    Effect.catchAll(error => {
      // clear the auth cookies if they've done something wrong
      clearAuthCookies(res);

      return Effect.fail(new UnauthorizedError(error.message));
    }),
  );
};

async function checkAuthentication_sync(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<User | null> {
  return Effect.runPromise(
    Effect.suspend(() => authenticationService.checkAuthentication(req, res)),
  ).catch(() => null);
}

const loginWithSiwe = ({
  siweMessage,
  userSignature,
  res,
  createUserIfNotFound = false,
}: {
  siweMessage: string;
  userSignature: Hex;
  res: NextApiResponse;
  createUserIfNotFound?: boolean;
}): Effect.Effect<
  User,
  UnauthorizedError | BadRequestError | GenericError | TokenCreationError
> => {
  const pipeline = pipe(
    { message: siweMessage, signature: userSignature },
    ({ message, signature }) =>
      Effect.all({
        isValid: Effect.tryPromise({
          try: async () =>
            await BASE_CLIENT.verifySiweMessage({ message, signature }),
          catch: e =>
            new BadRequestError(
              `Invalid SIWE message format: ${(e as Error)?.message}`,
            ),
        }).pipe(
          Effect.andThen(isValid =>
            isValid
              ? Effect.succeed(isValid)
              : Effect.fail(new UnauthorizedError('Invalid signature')),
          ),
        ),
        parsedMessage: Effect.try({
          try: () => parseSiweMessage(message),
          catch: e =>
            new BadRequestError(
              `Invalid SIWE message format: ${(e as Error)?.message}`,
            ),
        }).pipe(
          Effect.andThen(parsedMessage =>
            parsedMessage.address
              ? Effect.succeed(parsedMessage)
              : Effect.fail(new BadRequestError('Invalid siwe message')),
          ),
        ),
      }),
    Effect.andThen(({ parsedMessage }) =>
      Effect.all({
        user: effectfulUserService.findByWalletAddress(parsedMessage.address!),
        parsedMessage: Effect.succeed(parsedMessage),
      }),
    ),
    Effect.andThen(({ user: maybeUser, parsedMessage }) => {
      if (maybeUser) return Effect.succeed(maybeUser);
      if (createUserIfNotFound)
        return effectfulUserService.save(
          mapToUser({
            wallet: {
              __type: 'unknown',
              address: parsedMessage.address!,
            },
          }),
        );

      return Effect.fail(new UnauthorizedError('User not found'));
    }),
    // issue new auth tokens and refresh tokens for the user
    Effect.tap(user =>
      pipe(
        user,
        u => authenticationService.issueRefreshAndAccessToken(u.id),
        Effect.andThen(({ accessToken, refreshToken }) =>
          setAuthCookies(
            res,
            accessToken.tokenString,
            refreshToken.tokenString,
          ),
        ),
      ),
    ),
  );
  return pipeline;
};

export const authenticationService = {
  issueTokensFromRefreshToken,
  verifyAccessToken,
  issueRefreshAndAccessToken,
  verifyPrivyToken,
  checkAuthentication,
  checkAuthentication_sync,
  loginWithSiwe,
} as const;
