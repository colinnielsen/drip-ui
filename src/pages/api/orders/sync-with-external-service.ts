import { DripServerError, HTTPRouteHandlerErrors } from '@/lib/effect';
import { EffectfulApiRoute } from '@/lib/effect/next-api';
import { S, S_UUID, validateHTTPMethod } from '@/lib/effect/validation';
import OrderService from '@/services/OrderService';
import { Effect, pipe } from 'effect';
import { NextApiRequest, NextApiResponse } from 'next';

const SyncWithExternalServiceSchema = S.Struct({ orderIds: S.Array(S_UUID) });

export default EffectfulApiRoute(function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const pipeline = pipe(
    // pipe over the request
    req,
    // validate the method
    validateHTTPMethod('POST'),
    // extract the request body
    Effect.map(r => r.body),
    // validate the request body
    Effect.andThen(S.decode(SyncWithExternalServiceSchema)),
    // sync with the external service
    Effect.andThen(({ orderIds }) =>
      Effect.tryPromise(() =>
        OrderService.syncWithExternalService([...orderIds]),
      ),
    ),
    // return the orders
    Effect.andThen(orders => res.status(200).json(orders)),
    // handle errors
    Effect.catchAll(function (e): Effect.Effect<
      never,
      HTTPRouteHandlerErrors,
      never
    > {
      switch (e._tag) {
        // pluck out any non-500 errors and let them exist as-is
        case 'BadRequestError':
        case 'ParseError':
          // case 'NotFoundError':
          return Effect.fail(e);

        // all remaining errors and mark them as 500
        default:
          return Effect.fail(new DripServerError(e));
      }
    }),
  );

  return pipeline;
}, 'orders/sync-with-external-service');
