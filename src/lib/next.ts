import { Console, Effect, pipe } from 'effect';
import {
  catchAll,
  catchAllDefect,
  fail,
  runPromise,
  tapError,
  withSpan,
} from 'effect/Effect';
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next/types';
import { HTTPRouteHandlerErrors } from './effect';
import { getSessionId } from './session';
import { generateUUID, isUUID } from './utils';

export const getAndValidateUserRequest = (req: NextApiRequest) => {
  const userId = getSessionId(req);
  if (!userId) throw new Error('User ID not found');
  if (!isUUID(userId)) throw new Error('Invalid User ID');

  return userId;
};

export const revalidatePathIfExists = async (
  res: NextApiResponse,
  path: string,
) => {
  const response = await fetch(path, { method: 'HEAD' }).catch(() => {});
  if (response?.ok) await res.revalidate(path);
};

export const ApiRoute = <T extends NextApiHandler>(
  handler: T,
  handlerPrefix?: string,
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const id = generateUUID().slice(0, 4);
      const timePrefix = `\x1b[33m${handlerPrefix} time\x1b[0m ${id}`;
      console.time(timePrefix);
      const response = await handler(req, res);
      console.timeEnd(timePrefix);
      return response;
    } catch (error) {
      const predicate = handlerPrefix ? ` ${handlerPrefix}: ` : '';
      console.error(predicate, error);
      debugger;
      return res
        .status(500)
        .json({ error: `Drip Server Error:${predicate}${error}` });
    }
  };
};

const getHTTPRouteHandlerErrorCode = (e: HTTPRouteHandlerErrors): number => {
  switch (e._tag) {
    case 'ParseError':
    case 'BadRequestError':
      return 400;
    case 'NotFoundError':
      return 404;
    case 'DripServerError':
      return 500;
  }
};

export const EffectfulApiRoute = (
  route: (
    req: NextApiRequest,
    res: NextApiResponse,
  ) => Effect.Effect<
    // routes never return any data
    void,
    //  + they need to bubble up only http errors
    HTTPRouteHandlerErrors,
    //  + they have no requirements
    never
  >,
  handlerPrefix?: string,
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const nextApiProgram = pipe(
      // run the route
      route(req, res),
      // time the api call
      withSpan(`api: ${handlerPrefix}`),
      // log any errors
      tapError(Console.error),
      // catch all errors and return a 500
      catchAll(e => fail(res.status(getHTTPRouteHandlerErrorCode(e)).json(e))),
      // finally make sure uncaught errors do stop the program
      catchAllDefect(e =>
        fail(
          res
            .status(500)
            .json({ type: '🚨 fatal uncaught error 🚨', error: e }),
        ),
      ),
    );

    return await runPromise(nextApiProgram);
  };
};
