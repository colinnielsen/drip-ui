import redis from '@/infrastructures/redis/redis';
import { GenericError } from './effect/errors';
import { Effect, pipe } from 'effect';
import { SetCommandOptions } from '@upstash/redis';

type CacheConfig = {
  ttl?: number; // Time to live in seconds
  prefix?: string;
};

const createArgString = (args: any[]) =>
  JSON.stringify(args).replace(/:/g, ' ');

/**
 * Wraps an async function with Redis caching
 * @param fn The async function to wrap
 * @param config Cache configuration
 * @returns A wrapped function that checks cache first, then executes the original function
 */
export function withRedisCache<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  config: CacheConfig = {},
): (...args: TArgs) => Promise<TResult> {
  const { ttl = 3600, prefix = 'cache:' } = config;

  return async (...args: TArgs): Promise<TResult> => {
    // Generate cache key from function name and arguments
    const cacheKey = `${prefix}${fn.name}:${createArgString(args)}`;

    // Try to get from cache first
    const cachedResult = await redis.get<TResult>(cacheKey);
    if (cachedResult) return cachedResult;

    // If not in cache, execute function
    const result = await fn(...args);

    // Don't cache null/undefined results
    if (result == null) return result;

    // Store in cache with TTL
    await redis.set(cacheKey, result, { ex: ttl });

    return result;
  };
}

export const effectfulWithRedisCache = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  config: CacheConfig = {},
): Effect.Effect<TResult, GenericError, never> => {
  const { ttl = 3600, prefix = 'cache:' } = config;

  return Effect.tryPromise({
    try: async (...args: TArgs) => {
      // Generate cache key from function name and arguments
      const cacheKey = `${prefix}${fn.name}:${JSON.stringify(args)}`;

      // Try to get from cache first
      const cachedResult = await redis.get<TResult>(cacheKey);
      if (cachedResult) return cachedResult;

      // If not in cache, execute function
      const result = await fn(...args);

      // Don't cache null/undefined results
      if (result == null) return result;

      // Store in cache with TTL
      await redis.set(cacheKey, result, { ex: ttl });

      return result;
    },
    catch: error => new GenericError(error),
  });
};

/**
 * Effect-based Redis operations wrapper
 */
export const RedisEffect = {
  get: <T>(key: string): Effect.Effect<T | null, GenericError, never> =>
    Effect.tryPromise({
      try: () => redis.get<T>(key),
      catch: error => new GenericError(`Redis get error: ${error}`),
    }),

  set: (
    key: string,
    value: unknown,
    options?: SetCommandOptions,
  ): Effect.Effect<'OK', GenericError, never> =>
    Effect.tryPromise({
      try: () => redis.set(key, value, options).then(() => 'OK'),
      catch: error => new GenericError(`Redis set error: ${error}`),
    }),

  del: (key: string): Effect.Effect<number, GenericError, never> =>
    Effect.tryPromise({
      try: () => redis.del(key),
      catch: error => new GenericError(`Redis del error: ${error}`),
    }),
} as const;

/**
 * Effectful cache wrapper that properly handles Effect composition
 */
export const withRedisCacheEffect = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Effect.Effect<TResult, GenericError, never>,
  config: { ttl?: number; prefix?: string } = {},
) => {
  const { ttl = 3600, prefix = 'cache:' } = config;

  return (...args: TArgs): Effect.Effect<TResult, GenericError, never> => {
    const cacheKey = `${prefix}${fn.name}:${createArgString(args)}`;

    return pipe(
      RedisEffect.get<TResult>(cacheKey),
      Effect.flatMap(cachedResult => {
        if (cachedResult !== null) {
          return Effect.succeed(cachedResult);
        }

        return pipe(
          fn(...args),
          Effect.tap(result => {
            if (result != null) {
              return RedisEffect.set(cacheKey, result, { ex: ttl });
            }
            return Effect.unit;
          }),
          Effect.tapError(error =>
            Console.error(`Cache operation failed: ${error}`),
          ),
        );
      }),
    );
  };
};

// Example usage:
const effectfulFunction = (id: string) =>
  Effect.tryPromise({
    try: async () => ({ id, data: 'some data' }),
    catch: error => new GenericError(`Operation failed: ${error}`),
  });

const cachedEffectfulFunction = withRedisCacheEffect(effectfulFunction, {
  ttl: 3600,
  prefix: 'my-cache:',
});
