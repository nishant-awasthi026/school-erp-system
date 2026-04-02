import { PrismaClient } from '@prisma/client';
import { ConsistentHash, ShardNode } from '@/lib/infra/distributed-utils';
import { redisCacheExtension } from '@/lib/db/extensions';

/**
 * Shard Configuration
 *
 * Phase 1 (current): Single shard — Neon Primary + Neon Read Replica
 * Phase 2 (future):  Add shard-2 / shard-3 with Railway/Render DATABASE_URL_SHARD2/3 envs
 *
 * Weight controls virtual node count on the consistent hash ring.
 * Higher weight = more requests routed to that shard.
 */
const shards: (ShardNode & { primary: string; replica?: string })[] = [
  {
    id: 'shard-1',
    weight: 2,
    primary: process.env.DATABASE_URL!,
    replica: process.env.DATABASE_URL_REPLICA || process.env.DATABASE_URL!,
  },
  // Phase 2 — Uncomment when adding Railway/Render shards:
  // { id: 'shard-2', weight: 1.5, primary: process.env.DATABASE_URL_SHARD2!, replica: process.env.DATABASE_URL_SHARD2_REPLICA },
  // { id: 'shard-3', weight: 1.5, primary: process.env.DATABASE_URL_SHARD3!, replica: process.env.DATABASE_URL_SHARD3_REPLICA },
];

/**
 * Helper to create an extended Prisma client with caching and weight-based connection pooling.
 */
function createExtendedClient(url: string, weight: number = 1) {
  let pooledUrl = url;

  // For PostgreSQL: set a weight-based connection_limit.
  // DO NOT add pgbouncer=true manually — Neon's pooled endpoint already handles this.
  // Adding pgbouncer=true to an already-pooled URL causes double-pooling errors.
  if (
    (url.startsWith('postgresql://') || url.startsWith('postgres://')) &&
    !url.includes('connection_limit=')
  ) {
    const connectionLimit = Math.max(10, Math.floor(25 * weight));
    pooledUrl = url.includes('?')
      ? `${url}&connection_limit=${connectionLimit}`
      : `${url}?connection_limit=${connectionLimit}`;
  }

  return new PrismaClient({
    datasources: { db: { url: pooledUrl } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends(redisCacheExtension);
}

// Extract the type of an extended PrismaClient
type ExtendedClient = ReturnType<typeof createExtendedClient>;

/**
 * ShardPool manages multiple Extended PrismaClient instances
 */
class ShardPool {
  private clients: Map<string, { primary: ExtendedClient; replica: ExtendedClient }> = new Map();
  private ring: ConsistentHash;

  constructor() {
    // Build the consistent hash ring from the configured shards
    this.ring = new ConsistentHash(shards);

    for (const shard of shards) {
      if (!shard.primary) continue;
      this.clients.set(shard.id, {
        primary: createExtendedClient(shard.primary, shard.weight),
        replica: createExtendedClient(shard.replica || shard.primary, shard.weight),
      });
    }
  }

  /**
   * Gets the appropriate PrismaClient for a given schoolId and operation type.
   * Reads go to the replica; writes go to the primary.
   */
  public getClient(schoolId?: string, readOnly = false): ExtendedClient {
    const shardId = schoolId ? this.ring.getNode(schoolId) : 'shard-1';
    const shard = this.clients.get(shardId) || this.clients.get('shard-1')!;

    if (readOnly && shard.replica) {
      return shard.replica;
    }
    return shard.primary;
  }
}

// Global Singleton
declare global {
  var shardPool: undefined | ShardPool;
}

const pool = globalThis.shardPool ?? new ShardPool();
if (process.env.NODE_ENV !== 'production') globalThis.shardPool = pool;

/**
 * Primary export for the application.
 * Usage: const db = getDb(schoolId).user.findMany(...)
 */
export function getDb(schoolId?: string, options?: { readOnly?: boolean }) {
  return pool.getClient(schoolId, options?.readOnly);
}

// Export a default 'db' for non-sharded operations (hits SHARD-1 Primary)
const db = pool.getClient();
export default db;
