import {
  mapEthAddressToChainId,
  mapToUnsignedUSDCAcuthorization,
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
import { getDripRelayerAddress } from '@/lib/ethereum';
import shopService from '@/services/ShopService';
import { pipe, Effect } from 'effect';
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
    Effect.andThen(r => hydrateClassInstancesFromJSONBody(r.body)),
    // validate the request body
    Effect.andThen(S.decode(AuthorizationPayloadSchema)),
    // get the shop config
    Effect.andThen(({ orderTotal, shopId, payee }) =>
      Effect.all([
        Effect.tryPromise(() =>
          shopService.findShopConfigByShopId(shopId).then(
            maybeConfig =>
              maybeConfig ||
              (() => {
                throw new NotFoundError('Shop config not found for shop id');
              })(),
          ),
        ),
        Effect.succeed({ orderTotal, shopId, payee }),
      ]),
    ),
    // return the orders
    Effect.andThen(([shopConfig, { orderTotal, payee }]) => {
      if (
        !('fundRecipientConfig' in shopConfig) ||
        !shopConfig.fundRecipientConfig
      )
        return Effect.fail(
          new BadRequestError(
            'Shop config does not have a fund recipient config',
          ),
        );

      const network = mapEthAddressToChainId(
        shopConfig.fundRecipientConfig.recipient,
      );

      // funds are sent to the drip relayer
      const recipient = getDripRelayerAddress();

      const USDCConfig = USDC_CONFIG[network];

      return Effect.succeed({
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
    Effect.andThen(authorizationPayload => ({
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
    Effect.andThen(payload => res.status(200).json(payload)),
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
          return Effect.fail(e);

        // all remaining errors and mark them as 500
        default:
          return Effect.fail(new DripServerError(e));
      }
    }),
  );

  return pipeline;
}, 'orders/get-authorization-payload');
