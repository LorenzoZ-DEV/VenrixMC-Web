import { redis } from "./redis";

/**
 * Read-through cache helper. Returns the cached value if present, otherwise
 * runs `fn`, stores the result with the given TTL (seconds) and returns it.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const hit = await redis.get(key);
  if (hit !== null) {
    try {
      return JSON.parse(hit) as T;
    } catch {
      // fall through and refresh a corrupted entry
    }
  }

  const fresh = await fn();
  await redis.set(key, JSON.stringify(fresh), "EX", ttlSeconds);
  return fresh;
}

export async function invalidate(...keysToDrop: string[]) {
  if (keysToDrop.length === 0) return;
  await redis.del(...keysToDrop);
}

/** Invalidate every key matching a prefix, e.g. `venrix:cache:news:*`. */
export async function invalidatePrefix(prefix: string) {
  const stream = redis.scanStream({ match: `${prefix}*`, count: 100 });
  const toDelete: string[] = [];
  for await (const chunk of stream) {
    toDelete.push(...(chunk as string[]));
  }
  if (toDelete.length) await redis.del(...toDelete);
}

// TTL presets (seconds) used across the app so they stay documented in one place.
export const TTL = {
  NEWS_LIST: 60 * 5,
  NEWS_ITEM: 60 * 5,
  RULES: 60 * 60,
  APPLY_COUNTS: 60 * 2,
  APPLICATIONS_LIST: 60 * 2,
  STATS: 60 * 5,
  LITEBANS: 60,
  PLAYER_COUNT: 30,
  STAFF_POSITIONS: 60 * 5,
} as const;
