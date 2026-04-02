import { Prisma } from '@prisma/client';
import { getCached, setCached, isRedisConfigured } from '@/lib/infra/redis';

/**
 * Models that should be automatically cached in Redis.
 */
const CACHEABLE_MODELS = ['School', 'Class', 'Subject', 'User'];

/**
 * Prisma Extension to automate Redis caching across the application.
 * When Redis is not configured, all queries pass directly to the DB — no caching logic runs.
 */
export const redisCacheExtension = Prisma.defineExtension({
  name: 'redis-cache',
  query: {
    $allModels: {
      async findUnique({ model, args, query }) {
        // Skip cache entirely if Redis not configured or model not cacheable
        if (!isRedisConfigured || !CACHEABLE_MODELS.includes(model)) return query(args);

        const cacheKey = `prisma:${model}:findUnique:${JSON.stringify(args.where)}`;

        // 1. Check Redis Cache
        const cached = await getCached<any>(cacheKey);
        if (cached) return cached;

        // 2. Fetch from DB
        const result = await query(args);

        // 3. Populate Redis Cache (15 min TTL)
        if (result) {
          await setCached(cacheKey, result, 900);
        }

        return result;
      },

      async findFirst({ model, args, query }) {
        if (!isRedisConfigured || !CACHEABLE_MODELS.includes(model)) return query(args);

        const cacheKey = `prisma:${model}:findFirst:${JSON.stringify(args.where)}`;

        const cached = await getCached<any>(cacheKey);
        if (cached) return cached;

        const result = await query(args);
        if (result) {
          await setCached(cacheKey, result, 900);
        }
        return result;
      },

      // Pass-through for write operations
      async create({ model: _model, args, query }) {
        return query(args);
      },

      async update({ model, args, query }) {
        const result = await query(args);
        // Invalidate the cache entry for this record when Redis is active
        if (isRedisConfigured && CACHEABLE_MODELS.includes(model)) {
          const cacheKey = `prisma:${model}:findUnique:${JSON.stringify(args.where)}`;
          await setCached(cacheKey, null, 0); // Purge immediately
        }
        return result;
      },
    },
  },
});
