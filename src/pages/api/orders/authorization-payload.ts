import {
  mapToUnsignedUSDCAcuthorization,
  splitEthAddress,
} from '@/data-model/ethereum/EthereumDTO';
import { ChainId, USDCAuthorization } from '@/data-model/ethereum/EthereumType';
import { USDC_CONFIG } from '@/lib/contract-config/USDC';
import {
  BadRequestError,
  DripServerError,
  HTTPRouteHandlerErrors,
  hydrateClassInstancesFromJSONBody,
  NotFoundError,
} from '@/lib/effect';
import { EffectfulApiRoute } from '@/lib/effect/next-api';
import {
  S,
  S_Address,
  S_USDC,
  S_UUID,
  validateHTTPMethod,
} from '@/lib/effect/validation';
import shopService from '@/services/ShopService';
import { pipe } from 'effect';
import {
  all,
  andThen,
  catchAll,
  Effect,
  fail,
  flatMap,
  map,
  succeed,
  tryPromise,
} from 'effect/Effect';
import { NextApiRequest, NextApiResponse } from 'next';

const AuthorizationPayloadSchema = S.Struct({
  orderTotal: S_USDC,
  shopId: S_UUID,
  payee: S_Address,
});

export type AuthorizationPayloadRequest =
  typeof AuthorizationPayloadSchema.Type;

export type AuthorizationPayloadResponse = {
  domain: (typeof USDC_CONFIG)[ChainId]['eip712Domain'];
  types: (typeof USDC_CONFIG)[ChainId]['EIP712Types'];
  transferAuthorization: Omit<USDCAuthorization, 'signature'>;
};

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
    flatMap(r => hydrateClassInstancesFromJSONBody(r.body)),
    // validate the request body
    andThen(S.decode(AuthorizationPayloadSchema)),
    // get the shop config
    andThen(({ orderTotal, shopId, payee }) =>
      all([
        tryPromise(() =>
          shopService.findShopConfigByShopId(shopId).then(
            maybeConfig =>
              maybeConfig ||
              (() => {
                throw new NotFoundError('Shop config not found for shop id');
              })(),
          ),
        ),
        succeed({ orderTotal, shopId, payee }),
      ]),
    ),
    // return the orders
    andThen(([shopConfig, { orderTotal, payee }]) => {
      if (
        !('fundRecipientConfig' in shopConfig) ||
        !shopConfig.fundRecipientConfig
      )
        return fail(
          new BadRequestError(
            'Shop config does not have a fund recipient config',
          ),
        );

      const [network, recipient] = splitEthAddress(
        shopConfig.fundRecipientConfig.recipient,
      );

      const USDCConfig = USDC_CONFIG[network];

      return succeed({
        domain: USDCConfig.eip712Domain,
        types: USDCConfig.EIP712Types,
        transferAuthorization: mapToUnsignedUSDCAcuthorization({
          USDCConfig,
          from: payee,
          to: recipient,
          value: orderTotal.wei,
        }),
      } satisfies AuthorizationPayloadResponse);
    }),
    // map the bigints to strings
    andThen(authorizationPayload => ({
      ...authorizationPayload,
      transferAuthorization: {
        ...authorizationPayload.transferAuthorization,
        value: authorizationPayload.transferAuthorization.value.toString(),
        validAfter:
          authorizationPayload.transferAuthorization.validAfter.toString(),
        validBefore:
          authorizationPayload.transferAuthorization.validBefore.toString(),
      },
    })),
    // send the response
    map(payload => res.status(200).json(payload)),
    // handle errors
    catchAll(function (e): Effect<never, HTTPRouteHandlerErrors, never> {
      switch (e._tag) {
        // pluck out any non-500 errors and let them exist as-is
        case 'BadRequestError':
        case 'ParseError':
          return fail(e);

        // all remaining errors and mark them as 500
        default:
          return fail(new DripServerError(e));
      }
    }),
  );

  return pipeline;
}, 'orders/get-authorization-payload');
