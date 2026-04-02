export interface ShardNode {
  id: string;
  weight?: number; // Higher weight = more virtual nodes
}

/**
 * Consistent Hashing ring for distributing workloads across shards.
 * Supports weighted nodes for load balancing across varied hardware.
 */
export class ConsistentHash {
  private ring: Map<number, string> = new Map();
  private sortedKeys: number[] = [];
  private baseReplicas: number;

  constructor(nodes: (string | ShardNode)[], baseReplicas = 160) {
    this.baseReplicas = baseReplicas;
    for (const node of nodes) {
      if (typeof node === 'string') {
        this.addNode({ id: node, weight: 1 });
      } else {
        this.addNode(node);
      }
    }
  }

  private addNode(node: ShardNode) {
    const weight = node.weight || 1;
    const replicas = Math.floor(this.baseReplicas * weight);

    for (let i = 0; i < replicas; i++) {
      const hash = this.hash(`${node.id}:${i}`);
      this.ring.set(hash, node.id);
      this.sortedKeys.push(hash);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  private hash(key: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < key.length; i++) {
        h ^= key.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  public getNode(key: string): string {
    if (this.ring.size === 0) return 'default';
    const hash = this.hash(key);
    const pos = this.bisectRight(this.sortedKeys, hash);
    return this.ring.get(this.sortedKeys[pos % this.sortedKeys.length])!;
  }

  private bisectRight(array: number[], x: number): number {
    let low = 0;
    let high = array.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (x < array[mid]) high = mid;
      else low = mid + 1;
    }
    return low;
  }
}

/**
 * Singleflight prevents multiple concurrent identical requests from hitting the DB.
 */
export class Singleflight {
  private static promises = new Map<string, Promise<any>>();

  static async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.promises.get(key);
    if (existing) {
      console.log(`[Singleflight] Coalescing request for key: ${key}`);
      return existing;
    }

    const promise = fn().finally(() => {
      this.promises.delete(key);
    });

    this.promises.set(key, promise);
    return promise;
  }
}
