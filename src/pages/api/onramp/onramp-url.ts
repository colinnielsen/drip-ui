import { getOnrampBuyUrl } from '@coinbase/onchainkit/fund';
import { EffectfulApiRoute } from '@/lib/effect/next-api';
import {
  BadRequestError,
  DripServerError,
  HTTPRouteHandlerErrors,
  hydrateClassInstancesFromJSONBody,
} from '@/lib/effect';
import { S, S_Address, validateHTTPMethod } from '@/lib/effect/validation';
import { Effect, pipe } from 'effect';
import { NextApiRequest, NextApiResponse } from 'next';
import { axiosFetcher, generateUUID, isProd } from '@/lib/utils';
import { authenticationService } from '@/services/AuthenticationService';
import {
  getOnrampCallbackUrl,
  ONRAMP_TRANSACTION_ID_COOKIE_NAME,
} from '@/lib/onramping/onramping';

const OnrampQuoteSchema = S.Struct({
  amount: S.Number,
  recipientAddress: S_Address,
});

export type OnrampQuoteRequest = typeof OnrampQuoteSchema.Type;

export type CoinbaseOnrampQuoteResponse = {
  data: {
    payment_total: {
      amount: string;
      currency: string;
    };
    payment_subtotal: {
      amount: string;
      currency: string;
    };
    purchase_amount: {
      amount: string;
      currency: string;
    };
    coinbase_fee: {
      amount: string;
      currency: string;
    };
    network_fee: {
      amount: string;
      currency: string;
    };
    quote_id: string;
  };
};

export default EffectfulApiRoute(
  (req: NextApiRequest, res: NextApiResponse) => {
    const pipeline = pipe(
      // pipe over the request
      req,
      // check the request method
      validateHTTPMethod('POST'),
      Effect.andThen(req => {
        const referrer = req.headers.referer;
        if (!referrer)
          return Effect.fail(new BadRequestError('No referrer in headers'));
        return Effect.succeed(req);
      }),
      Effect.andThen(req =>
        Effect.all({
          // issue a transactionId for the onramp session
          transactionId: req.cookies[ONRAMP_TRANSACTION_ID_COOKIE_NAME]
            ? Effect.succeed(req.cookies[ONRAMP_TRANSACTION_ID_COOKIE_NAME])
            : Effect.succeed(generateUUID()).pipe(
                Effect.tap(uuid =>
                  res.setHeader(
                    'Set-Cookie',
                    [
                      `${ONRAMP_TRANSACTION_ID_COOKIE_NAME}=${uuid}`,
                      'Path=/',
                      // 'HttpOnly',
                      'SameSite=Lax',
                      isProd() ? 'Secure' : undefined,
                    ]
                      .filter(Boolean)
                      .join('; '),
                  ),
                ),
              ),
          // validate the request body against the schema
          reqBody: S.decode(OnrampQuoteSchema)(req.body),
        }),
      ),
      // get quote from Coinbase
      // Effect.andThen(({ amount, recipientAddress }) =>
      //   Effect.tryPromise({
      //     try: async () => {
      //       const response = await axiosFetcher<CoinbaseOnrampQuoteResponse>(
      //         'https://api.developer.coinbase.com/onramp/v1/buy/quote',
      //         {
      //           method: 'POST',
      //           data: {
      //             purchase_currency: '2b92315d-eab7-5bef-84fa-089a131333f5', // USDC
      //             purchase_network: 'base',
      //             payment_amount: amount,
      //             payment_currency: 'USD',
      //             payment_method: 'APPLE_PAY',
      //             country: 'US',
      //           },
      //         },
      //       );
      //       return { ...response, recipientAddress };
      //     },
      //     catch: e => {
      //       debugger;
      //       return new DripServerError(e);
      //     },
      //   }),
      // ),
      // Effect.andThen(quote => {
      //   const params = new URLSearchParams({
      //     appId: process.env.NEXT_PUBLIC_CDP_APP_ID || '',
      //     destinationWallets: JSON.stringify([{
      //       address: quote.recipientAddress,
      //       blockchains: ["base"]
      //     }]),
      //     defaultAsset: '2b92315d-eab7-5bef-84fa-089a131333f5',
      //     defaultPaymentMethod: 'APPLE_PAY',
      //     fiatCurrency: 'USD',
      //     presetFiatAmount: quote.data.payment_total.amount,
      //     quoteId: quote.data.quote_id
      //   });

      //   const buyUrl = `https://pay.coinbase.com/buy/select-asset?${params.toString()}`;
      //   return buyUrl;
      // }),
      Effect.andThen(({ reqBody, transactionId }) => {
        const buyUrl = getOnrampBuyUrl({
          projectId: process.env.NEXT_PUBLIC_CDP_APP_ID || '',
          addresses: {
            [reqBody.recipientAddress]: ['base'],
          },
          assets: ['USDC'],
          presetCryptoAmount: reqBody.amount,
          fiatCurrency: 'USD',
          defaultPaymentMethod: 'APPLE_PAY',
          defaultNetwork: 'base',
          partnerUserId: transactionId,
          redirectUrl: getOnrampCallbackUrl(req.headers.referer!),
        });
        // const params = new URLSearchParams({
        //   appId: process.env.NEXT_PUBLIC_CDP_APP_ID || '',
        //   destinationWallets: JSON.stringify([
        //     {
        //       address: req.recipientAddress,
        //       blockchains: ['base'],
        //     },
        //   ]),
        //   defaultAsset: '2b92315d-eab7-5bef-84fa-089a131333f5',
        //   defaultPaymentMethod: 'APPLE_PAY',
        //   fiatCurrency: 'USD',
        //   presetFiatAmount: req.amount.toString(),
        // });

        // const buyUrl = `https://pay.coinbase.com/buy/select-asset?${params.toString()}`;
        return buyUrl;
      }),
      // return the quote
      Effect.andThen(buyUrl => res.status(200).json({ url: buyUrl })),
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
  },
  'onramp/quote',
);
