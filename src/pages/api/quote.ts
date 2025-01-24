import { Currency } from '@/data-model/_common/currency';
import { subCurrencies } from '@/data-model/_common/currency/currencyDTO';
import {
  mapSliceProductIdToItemId,
  mapSliceProductToCurrency,
} from '@/data-model/_external/data-sources/slice/SliceDTO';
import { isItemId } from '@/data-model/item/ItemDTO';
import { ItemId } from '@/data-model/item/ItemType';
import {
  Discount,
  DiscountId,
  DiscountQuote,
} from '@/data-model/discount/DiscountType';
import { mapSliceExternalIdToSliceId } from '@/data-model/shop/ShopDTO';
import { SliceShopConfig, SquareShopConfig } from '@/data-model/shop/ShopType';
import {
  DripServerError,
  GenericError,
  HTTPRouteHandlerErrors,
  hydrateClassInstancesFromJSONBody,
  notNullEffect,
  UnimplementedPathError,
} from '@/lib/effect';
import {
  S,
  S_Address,
  S_UUID,
  validateHTTPMethod,
} from '@/lib/effect/validation';
import { EffectfulApiRoute } from '@/lib/effect/next-api';
import { withRedisCache } from '@/lib/redis';
import { sliceKit, SliceKitError } from '@/lib/slice';
import { err, generateUUID } from '@/lib/utils';
import { effectfulShopService } from '@/services/ShopService';
import { Effect, pipe } from 'effect';
import {
  all,
  andThen,
  catchAll,
  fail,
  succeed,
  tryPromise,
} from 'effect/Effect';
import {
  mapToDiscountId,
  mapToDiscountQuote,
} from '@/data-model/discount/DiscountDTO';

const SingleQuoteRequest = S.Struct({
  type: S.Literal('single'),
  userWalletAddress: S.optional(S_Address),
  userId: S.optional(S_UUID),
  shopId: S_UUID,
  itemId: S.String.pipe(S.fromBrand(ItemId)),
});

const ShopQuoteRequest = S.Struct({
  type: S.Literal('all'),
  userWalletAddress: S.optional(S_Address),
  userId: S.optional(S_UUID),
  shopId: S_UUID,
});

const QuoteRequestSchema = S.Union(SingleQuoteRequest, ShopQuoteRequest);

export type QuoteRequest = typeof QuoteRequestSchema.Type;
export type QuoteResponse = DiscountQuote[];

//
//// HANDLERS
///

const handleSliceQuote = (
  req: QuoteRequest,
  shopConfig: SliceShopConfig,
): Effect.Effect<DiscountQuote[], SliceKitError | GenericError, never> => {
  return pipe(
    { ...req, shopConfig },
    d =>
      tryPromise({
        try: async () =>
          await Promise.all([
            // fetch non-discount prices
            await withRedisCache(sliceKit.getStoreProducts)({
              slicerId: mapSliceExternalIdToSliceId(d.shopConfig.externalId),
            }),
            // fetch discount prices
            await withRedisCache(sliceKit.getStoreProducts)({
              slicerId: mapSliceExternalIdToSliceId(d.shopConfig.externalId),
              ...(d.userWalletAddress && { buyer: d.userWalletAddress }),
              dynamicPricing: true,
            }),
            d,
          ]),
        catch: e => new SliceKitError(e),
      }),
    andThen(([originalPrices, discountPrices, request]) => {
      const originalPriceLookup = originalPrices.cartProducts?.reduce<
        Record<ItemId, Currency | null>
      >(
        (acc, product) => ({
          ...acc,
          [mapSliceProductIdToItemId(product)]: mapSliceProductToCurrency(
            product,
            'price',
          ),
        }),
        {},
      );

      const discountPriceLookup = discountPrices.cartProducts?.reduce<
        Record<ItemId, Currency | null>
      >(
        (acc, product) => ({
          ...acc,
          [mapSliceProductIdToItemId(product)]: mapSliceProductToCurrency(
            product,
            'price',
          ),
        }),
        {},
      );

      const discountName = 'Slice store NFT promo';

      if (request.type === 'single') {
        const [originalPrice, discountPrice] = [
          originalPriceLookup[request.itemId],
          discountPriceLookup[request.itemId],
        ];

        if (!originalPrice) return [];
        if (!discountPrice) return [];

        if (originalPrice.eq(discountPrice)) return [];

        if (discountPrice.wei > originalPrice.wei)
          throw new GenericError(
            'discount price should be less than original price',
          );

        const priceDiff = subCurrencies(originalPrice, discountPrice);

        const discount: DiscountQuote = mapToDiscountQuote({
          itemId: request.itemId,
          discountName,
          amount: priceDiff,
        });

        return [discount];
      } else {
        return Object.entries(originalPriceLookup).reduce<DiscountQuote[]>(
          (discounts, [_itemId, originalPrice]) => {
            const itemId = isItemId(_itemId)
              ? _itemId
              : err('unexpected not _itemId');
            const discountPrice = discountPriceLookup[itemId];

            if (!originalPrice || !discountPrice) return discounts;
            if (originalPrice.eq(discountPrice)) return discounts;
            const priceDiff = subCurrencies(originalPrice, discountPrice);
            return [
              ...discounts,
              mapToDiscountQuote({ itemId, discountName, amount: priceDiff }),
            ];
          },
          [],
        );
      }
    }),
  );
};

const handleSquareQuote = (
  _qr: QuoteRequest,
  _shopConfig: SquareShopConfig,
): Effect.Effect<Discount[], never, never> => {
  return succeed([]);
};

//
//// ROUTE
///
export default EffectfulApiRoute((req, res) => {
  const pipeline = pipe(
    // pipe over the request
    req,
    // check the request method
    validateHTTPMethod('POST'),
    // rehydrate currencies
    andThen(req => hydrateClassInstancesFromJSONBody(req.body)),
    // validate the rquest body against the schema
    andThen(reqBody => S.decode(QuoteRequestSchema)(reqBody)),
    // load the shop config
    andThen(reqBody =>
      all([
        effectfulShopService
          .findShopConfigByShopId(reqBody.shopId)
          .pipe(notNullEffect),

        succeed(reqBody),
      ]),
    ),
    // depending on the shop config, return the quote
    andThen(([config, reqBody]) => {
      if (config.__type === 'square') return handleSquareQuote(reqBody, config);
      if (config.__type === 'slice') return handleSliceQuote(reqBody, config);

      let _: never = config;
      throw new UnimplementedPathError('config type not implemented');
    }),
    // return the discounts
    andThen(discounts => res.status(200).json(discounts)),
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
  return pipeline;
}, 'quote');
