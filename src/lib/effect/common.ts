import { AxiosError } from 'axios';
import { Effect, pipe } from 'effect';
import { rehydrateData } from '../utils';
import {
  BaseEffectError,
  GenericError,
  InvalidJSONError,
  NotFoundError,
} from './errors';

/**
 * @dev wrap any service GET function with a not null check
 */
export const existsOrNotFoundErr = <R, E, C>(
  e: Effect.Effect<R | null, E, C>,
) =>
  pipe(
    e,
    Effect.andThen(e =>
      e ? Effect.succeed(e) : Effect.fail(new NotFoundError('Not found')),
    ),
    Effect.map(e => e as R),
  );

export const extractErrorReadable = (error: any, verbose = false) => {
  if (error instanceof AxiosError) {
    const message =
      error.response?.data?.message ||
      (error.response?.data as string) ||
      'Unknown error';

    return !!verbose
      ? {
          responseCode: error.response?.status,
          endpoint: error.response?.config?.url,
          message,
        }
      : { message };
  }
  if (error instanceof Error) {
    const message = error?.message || JSON.stringify(error);
    return !!verbose
      ? {
          name: error.name,
          message,
        }
      : { message };
  }

  if (typeof error === 'string') return { message: error };
  return { message: JSON.stringify(error) };
};

export const hydrateClassInstancesFromJSONBody = <T = any>(
  body: any,
): Effect.Effect<T, InvalidJSONError, never> =>
  Effect.try({
    try: () => rehydrateData(body),
    catch: unknown => new InvalidJSONError((unknown as Error)?.message),
  });

/**
 * @dev wrap any service object with effect tryPromises
 */
export function createEffectService<
  T extends Record<string, (...args: any[]) => Promise<any>>,
>(
  service: T,
): {
  [K in keyof T]: (
    ...args: Parameters<T[K]>
  ) => Effect.Effect<Awaited<ReturnType<T[K]>>, GenericError, never>;
} {
  return Object.keys(service).reduce<{
    [K in keyof T]: (
      ...args: Parameters<T[K]>
    ) => Effect.Effect<Awaited<ReturnType<T[K]>>, GenericError, never>;
  }>(
    (acc, _key) => {
      const key = _key as keyof T;
      return {
        ...acc,
        [key]: (...args: Parameters<T[typeof key]>) =>
          Effect.tryPromise({
            try: () => service[key].bind(service)(...args),
            catch: error =>
              error instanceof BaseEffectError
                ? error
                : new GenericError(error),
          }),
      };
    },
    {} as {
      [K in keyof T]: (
        ...args: Parameters<T[K]>
      ) => Effect.Effect<Awaited<ReturnType<T[K]>>, GenericError, never>;
    },
  );
}
