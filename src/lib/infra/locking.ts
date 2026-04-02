import { redis, isRedisConfigured } from '@/lib/infra/redis';

/**
 * Distributed Lock Utility
 * Prevents race conditions during critical sections (e.g. Fee Payments, Year End Process).
 * Gracefully degrades to direct execution (no lock) when Redis is not configured.
 */
export async function withDistributedLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  ttlSeconds = 30
): Promise<T> {
  // No Redis → just run the function directly (acceptable for single-server local dev)
  if (!isRedisConfigured) {
    console.warn(`[Lock] Redis not configured — running '${lockKey}' without distributed lock (local dev only)`);
    return fn();
  }

  const fullLockKey = `lock:${lockKey}`;

  // 1. Attempt to acquire the lock atomically
  // SET "lock:key" "locked" EX <ttl> NX
  const acquired = await redis.set(fullLockKey, 'locked', {
    ex: ttlSeconds,
    nx: true,
  });

  if (!acquired) {
    throw new Error(`[Lock] Failed to acquire lock for key: ${lockKey}. Another process is already working on this.`);
  }

  try {
    // 2. Execute the critical section
    return await fn();
  } finally {
    // 3. Release the lock regardless of success/failure
    await redis.del(fullLockKey);
  }
}

/**
 * Check if a specific resource is currently locked.
 */
export async function isLocked(lockKey: string): Promise<boolean> {
  if (!isRedisConfigured) return false;
  const result = await redis.get(`lock:${lockKey}`);
  return !!result;
}
