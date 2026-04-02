import { Redis } from '@upstash/redis';

// Check if Redis is actually configured with real credentials
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

// A "real" config means the URL looks like an actual Upstash endpoint
const isRedisConfigured =
  REDIS_URL.startsWith('https://') &&
  REDIS_URL.includes('upstash.io') &&
  REDIS_TOKEN.length > 20;

if (!isRedisConfigured) {
  console.warn('[Redis] Not configured or using placeholder values — Redis features disabled. App will work normally without caching.');
}

// Only construct the Redis client when properly configured to avoid runtime errors
export const redis = isRedisConfigured
  ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
  : null as unknown as Redis;

/**
 * Safe Redis command wrapper — returns null/default on any failure.
 * This ensures the app never crashes due to Redis being unavailable.
 */
async function safeRedisCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isRedisConfigured) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.warn('[Redis] Operation failed, using fallback:', (err as Error).message);
    return fallback;
  }
}

/**
 * Bloom Filter utility using Redis Bloom module.
 * When Redis is not configured, always returns `true` (allow through) — safe degradation.
 */
export class BloomFilter {
  /**
   * Checks if a key possibly exists in the filter.
   * Returns true (allow through) when Redis unavailable — never blocks logins.
   */
  static async exists(name: string, value: string): Promise<boolean> {
    return safeRedisCall(async () => {
      const result = await (redis as any).call(['BF.EXISTS', name, value]);
      return result === 1;
    }, true); // fallback: treat as "possibly exists" → allow login to proceed to DB check
  }

  /**
   * Adds a value to the bloom filter (no-op when Redis unavailable).
   */
  static async add(name: string, value: string): Promise<void> {
    await safeRedisCall(async () => {
      await (redis as any).call(['BF.ADD', name, value]);
    }, undefined);
  }
}

/**
 * Global cache helper with TTL. Returns null (cache miss) when Redis unavailable.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  return safeRedisCall(() => redis.get<T>(key), null);
}

export async function setCached(key: string, value: any, ttlSeconds = 3600): Promise<void> {
  await safeRedisCall(() => redis.set(key, value, { ex: ttlSeconds }), undefined);
}

export { isRedisConfigured };
