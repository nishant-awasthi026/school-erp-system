import { redis, isRedisConfigured } from '@/lib/infra/redis';

interface RateLimitConfig {
    limit: number;      // max requests
    windowMs: number;   // time window in ms
}

/**
 * Distributed rate limiter using Upstash Redis.
 * Gracefully degrades to "allow all" when Redis is not configured (local dev).
 *
 * @param identifier e.g., IP address or email
 * @param config { limit, windowMs }
 * @returns { success: boolean, limit: number, remaining: number, reset: number }
 */
export async function rateLimit(
    identifier: string,
    config: RateLimitConfig = { limit: 10, windowMs: 15 * 60 * 1000 }
) {
    // Redis not configured → allow all requests (safe for local dev)
    if (!isRedisConfigured) {
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit,
            reset: Date.now() + config.windowMs,
        };
    }

    try {
        const key = `rl:${identifier}`;

        // Atomic increment
        const current = await redis.incr(key);

        // Set expiry only on first request in the window
        if (current === 1) {
            await redis.expire(key, Math.floor(config.windowMs / 1000));
        }

        const ttl = await redis.ttl(key);
        const reset = Date.now() + (ttl > 0 ? ttl * 1000 : config.windowMs);

        if (current > config.limit) {
            return { success: false, limit: config.limit, remaining: 0, reset };
        }

        return { success: true, limit: config.limit, remaining: config.limit - current, reset };
    } catch (err) {
        // Redis error → fail open (allow the request) to avoid breaking login
        console.warn('[RateLimit] Redis error, allowing request:', (err as Error).message);
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit,
            reset: Date.now() + config.windowMs,
        };
    }
}
