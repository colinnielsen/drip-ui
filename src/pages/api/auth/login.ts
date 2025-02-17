import { DripServerError } from '@/lib/effect';
import { EffectfulApiRoute } from '@/lib/effect/next-api';
import { S_Hex, validateHTTPMethod } from '@/lib/effect/validation';
import { authenticationService } from '@/services/AuthenticationService';
import { Effect, pipe } from 'effect';
import * as S from 'effect/Schema';
import { NextApiRequest, NextApiResponse } from 'next';

export const S_SiweMessage = S.Struct({
  message: S.String,
  signature: S_Hex,
});

export type LoginRequest = typeof S_SiweMessage.Type;

export class LoginError extends Error {
  readonly _tag = 'LoginError';
}

export default EffectfulApiRoute(function login(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const routePipeline = pipe(
    req,
    validateHTTPMethod('POST'),
    Effect.andThen(req => S.decode(S_SiweMessage)(req.body)),
    Effect.andThen(({ message, signature }) =>
      authenticationService.loginWithSiwe({
        userSignature: signature,
        siweMessage: message,
        res,
      }),
    ),
    Effect.andThen(user => Effect.succeed(res.status(200).json(user))),
    // catch specific errors
    Effect.catchTags({
      GenericError: e => Effect.fail(new DripServerError(e)),
      TokenCreationError: e => Effect.fail(new DripServerError(e)),
    }),
  );

  return routePipeline;
}, 'auth/login');
