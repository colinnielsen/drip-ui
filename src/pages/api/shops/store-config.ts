// endpoint to add square store to the config and then sync

import { Unsaved } from '@/data-model/_common/type/CommonType';
import { getLocationFromSquareLocation } from '@/data-model/_external/data-sources/square/SquareDTO';
import {
  getSliceExternalIdFromSliceId,
  getSqaureExternalId,
} from '@/data-model/shop/ShopDTO';
import { StoreConfig } from '@/data-model/shop/ShopType';
import {
  DripServerError,
  HTTPRouteHandlerErrors,
  S,
  SQLExecutionError,
  UnimplementedPathError,
  UUID,
  validateHTTPMethod,
  validateSessionToken,
} from '@/lib/effect';
import { EffectfulApiRoute } from '@/lib/next';
import shopService from '@/services/ShopService';
import { SquareService, SquareServiceError } from '@/services/SquareService';
import { Effect, pipe } from 'effect';
import { andThen, catchAll, fail, succeed, tryPromise } from 'effect/Effect';
import { NextApiRequest, NextApiResponse } from 'next';

const NewConfigSchema = S.Struct({
  name: S.String,
  logo: S.String,
  backgroundImage: S.String,
  url: S.String,
  farmerAllocation: S.mutable(
    S.Array(
      S.mutable(
        S.Struct({
          id: UUID,
          farmer: UUID,
          allocationBPS: S.Number,
        }),
      ),
    ),
  ),
});

const StoreConfigSchema = S.Union(
  S.extend(
    S.partial(NewConfigSchema),
    S.Struct({
      type: S.Literal('square'),
      action: S.Literal('add'),
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

export type StoreConfigRequest = typeof StoreConfigSchema.Type;

export default EffectfulApiRoute(function (
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const routePipeline = pipe(
    req,
    // handle wrong request method
    validateHTTPMethod(['PUT', 'POST']),
    // validate the session token
    andThen(validateSessionToken),
    // validate the request
    andThen(req => S.decode(StoreConfigSchema)(req.body)),
    andThen(body =>
      tryPromise({
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
    ),
    // create a store config
    andThen(data => {
      if (data.action === 'add') {
        const newStoreConfig: Unsaved<StoreConfig> = {
          __type: data.type,
          externalId:
            data.type === 'square'
              ? getSqaureExternalId({
                  merchantId: data.merchantId,
                  locationId: data.locationId,
                })
              : getSliceExternalIdFromSliceId(data.shopId),
          name: data.name || data?.squareLocation?.name || undefined,
          backgroundImage:
            data.backgroundImage ||
            data.squareLocation?.posBackgroundUrl ||
            data.squareLocation?.fullFormatLogoUrl ||
            undefined,
          logo: data.logo || data.squareLocation?.logoUrl || undefined,
          url: data.url || data.squareLocation?.websiteUrl || undefined,
          farmerAllocation: data.farmerAllocation || [],
          // TODO: add tip config
          tipConfig: {
            __type: 'single-recipient',
            enabled: false,
          },
          // let square provide the location data during the sync step
          location:
            data.type === 'square'
              ? data.squareLocation.address
                ? getLocationFromSquareLocation(data.squareLocation)
                : undefined
              : data.location,
        };

        return succeed(newStoreConfig);
      } else if (data.action === 'update') {
        //  TODO: update the store config
      }
      return fail(new UnimplementedPathError('update route not implemented'));
    }),
    // save the store config
    andThen(newConfig =>
      tryPromise({
        try: () => shopService.saveStoreConfig(newConfig),
        catch: e => new SQLExecutionError(e),
      }),
    ),
    // retyrn the saved config w/ 200 status
    andThen(savedConfig => res.status(200).json(savedConfig)),
    // handle errors
    catchAll(function (e): Effect.Effect<never, HTTPRouteHandlerErrors, never> {
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

  return routePipeline;
}, '/shops/store-config');
