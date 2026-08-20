import Redis from "ioredis";
import { MemoryRedisConnection } from "./memoryRedis";

const USE_MOCK = process.env.REDIS_MOCK === "true";

if (USE_MOCK && process.env.NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.warn(
    "[redis] REDIS_MOCK=true in produzione — i dati (sessioni, cache, rate limit) vivono solo in memoria e si perdono ad ogni riavvio/istanza. Disattivalo prima del deploy."
  );
}

/**
 * Creates one Redis "connection". In normal mode this is a real ioredis
 * client; with REDIS_MOCK=true it's an in-process shim (see memoryRedis.ts)
 * so the app runs without Docker/Redis in local dev. Used both for the
 * shared singleton below and for the dedicated pub/sub connections in
 * lib/pubsub.ts.
 */
export function createRedisConnection(): Redis {
  if (USE_MOCK) {
    return new MemoryRedisConnection() as unknown as Redis;
  }
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });
}

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

/**
 * Singleton client. Reused across hot-reloads in dev and across requests in
 * prod so we don't exhaust connections.
 */
export const redis = globalForRedis.redis ?? createRedisConnection();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// Key namespacing helpers — keeps `venrix:*` naming consistent everywhere.
export const keys = {
  cache: (entity: string, id: string | number = "all") => `venrix:cache:${entity}:${id}`,
  session: (sessionId: string) => `venrix:session:${sessionId}`,
  rateLimit: (ip: string, endpoint: string) => `venrix:ratelimit:${ip}:${endpoint}`,
  lock: (name: string) => `venrix:lock:${name}`,
  oauthState: (state: string) => `venrix:oauth:discord:${state}`,
};
