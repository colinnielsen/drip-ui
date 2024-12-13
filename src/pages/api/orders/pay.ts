import { ETH } from '@/data-model/_common/currency/ETH';
import { USDC } from '@/data-model/_common/currency/USDC';
import {
  DripServerError,
  HTTPRouteHandlerErrors,
  hydrateClassInstancesFromJSONBody,
} from '@/lib/effect';
import { Hex, S, UUID, validateHTTPMethod } from '@/lib/effect/validation';
import { EffectfulApiRoute } from '@/lib/next';
import OrderService from '@/services/OrderService';
import { Effect, pipe } from 'effect';
import { andThen, catchAll, fail } from 'effect/Effect';
import { NextApiRequest, NextApiResponse } from 'next';

const CurrenciesUnion = S.Union(S.instanceOf(USDC), S.instanceOf(ETH));

const PaidPrices = S.Record({
  key: S.UUID,
  value: CurrenciesUnion,
});

const PaySchema = S.Union(
  S.Struct({
    type: S.Literal('square'),
    signature: Hex,
    orderId: UUID,
    paidPrices: PaidPrices,
  }),
  S.Struct({
    type: S.Literal('slice'),
    orderId: UUID,
    transactionHash: Hex,
    paidPrices: PaidPrices,
  }),
);

export type PayRequest = typeof PaySchema.Type;

export default EffectfulApiRoute(function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const routePipeline = pipe(
    // pipe over the request
    req,
    // check the request method
    validateHTTPMethod('POST'),
    // hydrate the request body
    andThen(({ body }) => hydrateClassInstancesFromJSONBody(body)),
    // validate the rquest body against the schema
    andThen(S.decode(PaySchema)),
    // pay for the order
    andThen(OrderService.pay),
    // return the order
    andThen(order => res.status(200).json(order)),
    // handle errors
    catchAll(function (e): Effect.Effect<never, HTTPRouteHandlerErrors, never> {
      switch (e._tag) {
        // pluck out any non-500 errors and let them exist as-is
        case 'BadRequestError':
        case 'ParseError':
        case 'NotFoundError':
          return fail(e);

        // all remaining errors and mark them as 500
        default:
          return fail(new DripServerError(e));
      }
    }),
  );

  return routePipeline;
}, 'orders/pay');
