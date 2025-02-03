import { Console, Effect, pipe } from 'effect';

import { NextApiRequest, NextApiResponse } from 'next';
import { HTTPRouteHandlerErrors } from './errors';

const getHTTPRouteHandlerErrorCode = (e: HTTPRouteHandlerErrors): number => {
  switch (e._tag) {
    case 'ParseError':
    case 'BadRequestError':
      return 400;
    case 'NotFoundError':
      return 404;
    case 'DripServerError':
      return 500;
    case 'UnauthorizedError':
      return 401;
  }
};

/**
 * @dev wraps any nextjs api route file with an effect pipeline
 * @dev example: {@link PayRoute}
 */
export const EffectfulApiRoute = (
  route: (
    req: NextApiRequest,
    res: NextApiResponse,
  ) => Effect.Effect<void, HTTPRouteHandlerErrors, never>,
  handlerPrefix?: string,
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const nextApiProgram = pipe(
      // run the route
      route(req, res),
      // time the api call
      Effect.withSpan(`api: ${handlerPrefix}`),
      // log any errors
      Effect.tapError(Console.error),
      // catch all errors and return a 500
      Effect.catchAll(e =>
        Effect.fail(res.status(getHTTPRouteHandlerErrorCode(e)).json(e)),
      ),
      // finally make sure uncaught errors do stop the program
      Effect.catchAllDefect((e: any) => {
        Console.error(e);
        const wrappedError = new Error(e);

        return Effect.fail(
          res.status(500).json({
            type: '🚨 fatal uncaught error 🚨',
            message: wrappedError.message,
            error: wrappedError,
          }),
        );
      }),
    );

    return await Effect.runPromise(nextApiProgram);
  };
};
