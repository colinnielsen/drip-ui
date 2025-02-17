import { Unsaved } from '@/data-model/_common/type/CommonType';
import { mapSquareLocationToLocation } from '@/data-model/_external/data-sources/square/SquareDTO';
import {
  mapSliceIdToSliceExternalId,
  mapToSqaureExternalId,
} from '@/data-model/shop/ShopDTO';
import { ShopConfig, SquareShopConfig } from '@/data-model/shop/ShopType';
import {
  DripServerError,
  HTTPRouteHandlerErrors,
  NotFoundError,
  SQLExecutionError,
} from '@/lib/effect';
import { EffectfulApiRoute } from '@/lib/effect/next-api';
import {
  S,
  S_UUID,
  validateHTTPMethod,
  validateSessionToken,
} from '@/lib/effect/validation';
import { S_EthAddress } from '@/lib/effect/validation/ethereum';
import shopService from '@/services/ShopService';
import { SquareService, SquareServiceError } from '@/services/SquareService';
import { Effect, pipe } from 'effect';

import { NextApiRequest, NextApiResponse } from 'next';

const NewConfigSchema = S.Struct({
  name: S.String,
  logo: S.String,
  backgroundImage: S.String,
  url: S.String,
  fundRecipient: S.optional(S_EthAddress),
  tipRecipient: S.optional(S_EthAddress),
  farmerAllocation: S.mutable(
    S.Array(
      S.mutable(
        S.Struct({
          id: S_UUID,
          farmer: S_UUID,
          allocationBPS: S.Number,
        }),
      ),
    ),
  ),
});

const ShopConfigSchema = S.Union(
  S.extend(
    S.partial(NewConfigSchema),
    S.Struct({
      type: S.Literal('square'),
      action: S.Union(S.Literal('add'), S.Literal('update')),
      locationId: S.String,
      merchantId: S.String,
    }),
  ),
  S.extend(
    S.partial(NewConfigSchema),
    S.Struct({
      type: S.Literal('slice'),
      action: S.Literal('add'),
      shopId: S.Number,
      location: S.Struct({
        coords: S.mutable(S.Tuple(S.Number, S.Number)),
        label: S.String,
        address: S.String,
      }),
    }),
  ),
);

export type ShopConfigRequest = typeof ShopConfigSchema.Type;

export default EffectfulApiRoute(function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const routePipeline = pipe(
    req,
    // handle wrong request method
    validateHTTPMethod(['PUT', 'POST', 'GET']),
    // validate the session token
    Effect.andThen(validateSessionToken),
    // validate the request
    Effect.andThen(req => S.decode(ShopConfigSchema)(req.body)),
    Effect.andThen(body =>
      Effect.all([
        Effect.tryPromise({
          try: async () => {
            if (body.type === 'square' && body.action === 'update') {
              const existingShopConfig =
                await shopService.findShopConfigByExternalId(
                  mapToSqaureExternalId({
                    merchantId: body.merchantId,
                    locationId: body.locationId,
                  }),
                );
              if (!existingShopConfig)
                throw new NotFoundError('Shop config not found');
              return existingShopConfig!;
            }
          },
          catch: e => e as NotFoundError | SQLExecutionError,
        }),
        Effect.tryPromise({
          try: async () => {
            if (body.type === 'square')
              return {
                squareLocation: await SquareService.fetchLocation(
                  body.merchantId,
                  body.locationId,
                ),
                ...body,
              };
            else
              return {
                squareLocation: undefined,
                ...body,
              };
          },
          catch: e => new SquareServiceError(e),
        }),
      ]),
    ),
    // create a shop config
    Effect.andThen(([prevConfig, data]) => {
      const newShopConfig: Unsaved<ShopConfig> = {
        ...(prevConfig || {}),
        __type: data.type,
        externalId:
          data.type === 'square'
            ? mapToSqaureExternalId({
                merchantId: data.merchantId,
                locationId: data.locationId,
              })
            : mapSliceIdToSliceExternalId(data.shopId),
        name: data.name || data?.squareLocation?.name || undefined,
        backgroundImage:
          data.backgroundImage ||
          data.squareLocation?.posBackgroundUrl ||
          data.squareLocation?.fullFormatLogoUrl ||
          undefined,
        logo: data.logo || data.squareLocation?.logoUrl || undefined,
        url: data.url || data.squareLocation?.websiteUrl || undefined,
        farmerAllocation: data.farmerAllocation || [],
        ...(data.type === 'square' && data.fundRecipient
          ? {
              fundRecipientConfig: {
                __type: 'single-recipient',
                recipient: data.fundRecipient,
              } satisfies SquareShopConfig['fundRecipientConfig'],
            }
          : {}),
        ...(data.type === 'square' && data.tipRecipient
          ? {
              tipConfig: {
                __type: 'single-recipient',
                recipient: data.tipRecipient,
              } satisfies SquareShopConfig['tipConfig'],
            }
          : {}),
        // let square provide the location data during the sync step
        location:
          data.type === 'square'
            ? data.squareLocation.address
              ? mapSquareLocationToLocation(data.squareLocation)
              : undefined
            : undefined,
      };

      return Effect.succeed(newShopConfig);
    }),
    // save the shop config
    Effect.andThen(newConfig =>
      Effect.tryPromise({
        try: () => shopService.saveShopConfig(newConfig),
        catch: e => new SQLExecutionError(e),
      }),
    ),
    // retyrn the saved config w/ 200 status
    Effect.andThen(savedConfig => res.status(200).json(savedConfig)),
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
        // Effect.all remaining errors and mark them as 500
        default:
          return Effect.fail(new DripServerError(e));
      }
    }),
  );

  return routePipeline;
}, '/shops/shop-config');
