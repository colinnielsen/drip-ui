import { initCurrencyZero } from '@/data-model/_common/currency/currencyDTO';
import { calculateCartTotals } from '@/data-model/cart/CartDTO';
import { setAuthCookies } from '@/lib/auth-tokens';
import {
  BadRequestError,
  DripServerError,
  HTTPRouteHandlerErrors,
  hydrateClassInstancesFromJSONBody,
  UnauthorizedError,
} from '@/lib/effect';
import { EffectfulApiRoute } from '@/lib/effect/next-api';
import { S, validateHTTPMethod } from '@/lib/effect/validation';
import { S_Hex } from '@/lib/effect/validation/base';
import { CartSchema } from '@/lib/effect/validation/cart';
import {
  S_Address,
  S_USDCAuthorization,
} from '@/lib/effect/validation/ethereum';
import { BASE_CLIENT } from '@/lib/ethereum';
import { authenticationService } from '@/services/AuthenticationService';
import OrderService from '@/services/OrderService';
import userService from '@/services/UserService';
import { Effect, Either, pipe } from 'effect';
import { NextApiRequest, NextApiResponse } from 'next';

const PaySchema = S.Union(
  S.Struct({
    type: S.Literal('square'),
    usdcAuthorization: S_USDCAuthorization,
    cart: CartSchema,
  }),
  S.Struct({
    type: S.Literal('slice'),
    sliceOrderId: S.String,
    transactionHash: S_Hex,
    totalPaidWei: S.BigInt,
    payerAddress: S_Address,
    cart: CartSchema,
  }),
);

export type PayRequest = typeof PaySchema.Type;

const validatePayload = (
  _req: NextApiRequest,
  body: PayRequest,
): Effect.Effect<PayRequest, UnauthorizedError | BadRequestError> =>
  pipe(
    body,
    body => (body.type === 'square' ? Either.left(body) : Either.right(body)),
    body =>
      Either.match(body, {
        // validate square cart
        onLeft(squarePayload) {
          const { cart } = squarePayload;

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
            return Effect.fail(
              new BadRequestError(
                'Error: The cart quoted to the user differs from the calculation on the server',
              ),
            );

          return Effect.succeed(squarePayload);
        },
        onRight(right) {
          return pipe(
            right,
            // ensure the transaction exists onchain
            slicePayload =>
              Effect.tryPromise(() =>
                BASE_CLIENT.waitForTransactionReceipt({
                  hash: slicePayload.transactionHash,
                }),
              ),
            Effect.andThen(receipt =>
              // and it was succesful
              receipt.status === 'success'
                ? Effect.succeed(right)
                : Effect.fail(new BadRequestError('Tx not successful')),
            ),
            Effect.catchTag('UnknownException', () =>
              Effect.fail(new BadRequestError('Tx hash not found onchain')),
            ),
          );
        },
      }),
  );

const PayRoute = EffectfulApiRoute(function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const routePipeline = pipe(
    // pipe over the request
    req,
    // check the request method
    validateHTTPMethod('POST'),
    // hydrate the request body
    Effect.andThen(({ body }) => hydrateClassInstancesFromJSONBody(body)),
    // validate the rquest body against the schema
    Effect.andThen(S.decode(PaySchema)),
    // validate the contents of the body
    Effect.andThen(b => validatePayload(req, b)),
    // gets the user from the pay request by either cookies, or wallet address.
    //  or creates a new user if it's their first order
    //  and sets cookies if the user is new
    Effect.andThen(payload =>
      Effect.all({
        user: userService.getOrInitializeUserFromPayRequest(req, res, payload),
        payload: Effect.succeed(payload),
      }),
    ),
    // pay for the order
    Effect.andThen(({ payload, user }) =>
      Effect.all({
        order: OrderService.pay(user.id, payload),
        user: Effect.succeed(user),
      }),
    ),
    // issue tokens
    Effect.andThen(({ order, user }) =>
      pipe(
        // pipe over the user id
        user.id,
        uid =>
          Effect.all({
            // generate a new token pair
            tokens: authenticationService.issueRefreshAndAccessToken(uid),
            order: Effect.succeed(order),
          }),
      ),
    ),
    Effect.andThen(({ tokens: { accessToken, refreshToken }, order }) => {
      // and set the auth cookies on the response
      setAuthCookies(res, accessToken.tokenString, refreshToken.tokenString);
      // return the order
      return res.status(200).json(order);
    }),
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
        case 'UnauthorizedError':
        case 'NotFoundError':
          return Effect.fail(e);

        // all remaining errors and mark them as 500
        default:
          return Effect.fail(new DripServerError(e));
      }
    }),
  );

  return routePipeline;
}, 'orders/pay');

export default PayRoute;
