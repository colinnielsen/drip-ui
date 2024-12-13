import { Effect } from 'effect';
import { rehydrateData } from '../utils';
import { InvalidJSONError } from './errors';

export const hydrateClassInstancesFromJSONBody = <T = any>(
  body: any,
): Effect.Effect<T, InvalidJSONError, never> =>
  Effect.try({
    try: () => rehydrateData(body),
    catch: unknown => new InvalidJSONError((unknown as Error)?.message),
  });
