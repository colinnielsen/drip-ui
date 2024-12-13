import { Effect, pipe } from 'effect';
import * as S from 'effect/Schema';
import { BadRequestError } from './errors';
import { NextApiRequest } from 'next';
import { getTempSquareOAuthId } from '../session';
import { andThen, option } from 'effect/Effect';

export const UUID = S.TemplateLiteral(
  S.String,
  '-',
  S.String,
  '-',
  S.String,
  '-',
  S.String,
  '-',
  S.String,
);

export const Hex = S.TemplateLiteral('0x', S.String);

export { S };

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
