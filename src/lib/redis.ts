import redis from '@/infrastructures/redis/redis';
import { SetCommandOptions } from '@upstash/redis';
import { Console, Effect, pipe } from 'effect';
import { ErrorWithTag, RedisError } from './effect/errors';

type CacheConfig = {
  ttl?: number; // Time to live in seconds
  prefix?: string;
};

const createArgString = (args: any[]) =>
  JSON.stringify(args).replace(/:/g, ' ');

const createCacheKey = (fn: Function, args: any[], extraPrefix?: string) =>
  `${extraPrefix ? `${extraPrefix}:` : ''}${fn.name}:${createArgString(args)}`;

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
    const cacheKey = createCacheKey(fn, args, prefix);

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

/**
 * Effect-based Redis operations wrapper
 */
const RedisEffect = {
  get: <T>(key: string): Effect.Effect<T | null, RedisError, never> =>
    Effect.tryPromise({
      try: () => redis.get<T>(key),
      catch: error => new RedisError(`Redis get error: ${error}`),
    }),

  set: (
    key: string,
    value: unknown,
    options?: SetCommandOptions,
  ): Effect.Effect<'OK', RedisError, never> =>
    Effect.tryPromise({
      try: () => redis.set(key, value, options).then(() => 'OK'),
      catch: error => new RedisError(`Redis set error: ${error}`),
    }),

  del: (key: string): Effect.Effect<number, RedisError, never> =>
    Effect.tryPromise({
      try: () => redis.del(key),
      catch: error => new RedisError(`Redis del error: ${error}`),
    }),
} as const;

/**
 * Effectful cache wrapper that properly handles Effect composition
 * @example
 * ```ts
 * pipe(
 * ...,
 * withRedisCacheEffect(myAsyncFunction)(...myArgs),
 * andThen(r => r),
 * catchError(e)
 *            ^ is TError | RedisError
 * )
 * ```
 */
export const withRedisCacheEffect = <
  TArgs extends any[],
  TResult,
  TError extends ErrorWithTag = never,
>(
  fn: (...args: TArgs) => Promise<TResult>,
  config: { ttl?: number; prefix?: string } = {},
) => {
  const { ttl = 3600, prefix = 'cache:' } = config;

  return (
    ...args: TArgs
  ): Effect.Effect<TResult, RedisError | TError, never> => {
    const cacheKey = createCacheKey(fn, args, prefix);

    return pipe(
      RedisEffect.get<TResult>(cacheKey),
      Effect.flatMap(cachedResult => {
        if (cachedResult !== null) return Effect.succeed(cachedResult);

        return pipe(
          Effect.tryPromise({
            try: async () => await fn(...args),
            catch: error => error as TError,
          }),
          Effect.tap(result => {
            if (result != null)
              return RedisEffect.set(cacheKey, result, { ex: ttl });
          }),
          Effect.tapError(error =>
            Console.error(`Cache operation failed: ${error}`),
          ),
        );
      }),
    );
  };
};
