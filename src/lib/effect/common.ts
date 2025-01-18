import { Effect } from 'effect';
import { rehydrateData } from '../utils';
import { InvalidJSONError } from './errors';
import { AxiosError } from 'axios';

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

  return { message: JSON.stringify(error) };
};

export const hydrateClassInstancesFromJSONBody = <T = any>(
  body: any,
): Effect.Effect<T, InvalidJSONError, never> =>
  Effect.try({
    try: () => rehydrateData(body),
    catch: unknown => new InvalidJSONError((unknown as Error)?.message),
  });
