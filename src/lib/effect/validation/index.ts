import { Effect, pipe } from 'effect';
import { andThen } from 'effect/Effect';
import { NextApiRequest } from 'next';
import { BadRequestError } from '../errors';
import { getTempSquareOAuthId } from '@/lib/data-sources/square';

export * as S from 'effect/Schema';
export * from './base';
export * from './ethereum';
export * from './currency';
export * from './cart';

const HTTP_METHODS = ['POST', 'GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
export type HTTPMethods = (typeof HTTP_METHODS)[number];

export const validateHTTPMethod =
  (method: HTTPMethods | HTTPMethods[]) =>
  (req: NextApiRequest): Effect.Effect<NextApiRequest, BadRequestError> => {
    const allowedMethods = Array.isArray(method) ? [...method] : [method];
    if (!req.method)
      return Effect.fail(new BadRequestError('Method not found'));

    if (!allowedMethods.includes(req.method as HTTPMethods))
      return Effect.fail(
        new BadRequestError(`HTTP Method should be ${method}`),
      );

    return Effect.succeed(req);
  };

export const validateSessionToken = (req: NextApiRequest) => {
  return pipe(
    req,
    req => Effect.try(() => getTempSquareOAuthId(req)),
    andThen(userId => {
      if (!userId)
        return Effect.fail(new BadRequestError('Session token not found'));

      return Effect.succeed(req);
    }),
    Effect.catchAll(e => Effect.fail(new BadRequestError(e.message))),
  );
};
