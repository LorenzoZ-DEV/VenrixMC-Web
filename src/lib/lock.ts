import { randomBytes } from "crypto";
import { redis, keys } from "./redis";

/**
 * Distributed lock via Redis SET NX PX. Prevents double-submit on critical
 * operations (e.g. two identical appeal submissions racing each other).
 * Returns null if the lock could not be acquired.
 */
export async function acquireLock(
  name: string,
  ttlMs = 10_000
): Promise<(() => Promise<void>) | null> {
  const token = randomBytes(16).toString("hex");
  const key = keys.lock(name);

  const result = await redis.set(key, token, "PX", ttlMs, "NX");
  if (result !== "OK") return null;

  return async () => {
    // Only release if we still own the lock (avoids releasing a lock
    // acquired by someone else after ours expired).
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await redis.eval(script, 1, key, token);
  };
}

export async function withLock<T>(
  name: string,
  fn: () => Promise<T>,
  ttlMs = 10_000
): Promise<T | { locked: true }> {
  const release = await acquireLock(name, ttlMs);
  if (!release) return { locked: true };
  try {
    return await fn();
  } finally {
    await release();
  }
}
