/** Simple in-memory TTL cache and sliding-window rate limiter for serverless-unfriendly local use. */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

const buckets = new Map<string, number[]>();

/** Returns true if the action is allowed; records the attempt. */
export function rateLimitOk(bucket: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(bucket) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(bucket, hits);
    return false;
  }
  hits.push(now);
  buckets.set(bucket, hits);
  return true;
}
