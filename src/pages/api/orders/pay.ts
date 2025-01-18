import { initCurrencyZero } from '@/data-model/_common/currency/currencyDTO';
import { calculateCartTotals } from '@/data-model/cart/CartDTO';
import {
  BadRequestError,
  DripServerError,
  HTTPRouteHandlerErrors,
  hydrateClassInstancesFromJSONBody,
  UnauthorizedError,
} from '@/lib/effect';
import { S, validateHTTPMethod } from '@/lib/effect/validation';
import { S_Hex, S_UUID } from '@/lib/effect/validation/base';
import { CartSchema } from '@/lib/effect/validation/cart';
import { S_USDCAuthorization } from '@/lib/effect/validation/ethereum';
import { EffectfulApiRoute } from '@/lib/next';
import { getSessionId } from '@/lib/session';
import OrderService from '@/services/OrderService';
import { Effect, Either, pipe } from 'effect';
import { andThen, catchAll, fail, succeed } from 'effect/Effect';
import { NextApiRequest, NextApiResponse } from 'next';

const PaySchema = S.Union(
  S.Struct({
    type: S.Literal('square'),
    usdcAuthorization: S_USDCAuthorization,
    cart: CartSchema,
  }),
  S.Struct({
    type: S.Literal('slice'),
    orderId: S_UUID,
    transactionHash: S_Hex,
  }),
);

export type PayRequest = typeof PaySchema.Type;

const validatePayload = (
  req: NextApiRequest,
  body: PayRequest,
): Effect.Effect<PayRequest, UnauthorizedError | BadRequestError> =>
  pipe(
    body,
    b => (b.type === 'square' ? Either.left(b) : Either.right(b)),
    b =>
      Either.match(b, {
        // validate square cart
        onLeft(squarePayload) {
          const { cart } = squarePayload;
          const userId = getSessionId(req);
          // validate userid === requestee
          if (!userId || cart.user !== userId)
            return fail(new UnauthorizedError('Unauthorized'));

          // ensure correct totals
          const {
            quotedDiscountAmount,
            quotedSubtotal,
            quotedTaxAmount,
            quotedTotalAmount,
          } = calculateCartTotals(cart);

          const CURRENCY_ZERO = initCurrencyZero(
            quotedDiscountAmount.__currencyType,
          );

          if (
            !quotedDiscountAmount.eq(
              cart.quotedDiscountAmount ?? CURRENCY_ZERO,
            ) ||
            !quotedSubtotal.eq(cart.quotedSubtotal ?? CURRENCY_ZERO) ||
            !quotedTaxAmount.eq(cart.quotedTaxAmount ?? CURRENCY_ZERO) ||
            !quotedTotalAmount.eq(cart.quotedTotalAmount ?? CURRENCY_ZERO)
          )
            return fail(
              new BadRequestError(
                'Discount amount cannot be equal to subtotal, tax, or total',
              ),
            );

          return succeed(squarePayload);
        },
        // slice cart is very simple and is validated by the schema
        onRight(right) {
          return succeed(right);
        },
      }),
  );

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
    // validate the contents of the body
    andThen(b => validatePayload(req, b)),
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
        case 'UnauthorizedError':
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
