import { EventEmitter } from "events";

/**
 * Minimal in-process stand-in for the subset of the ioredis API this project
 * actually uses (get/set/del/incr/expire/ttl/eval/scanStream/publish/subscribe).
 * Enabled via REDIS_MOCK=true so the app runs locally without Docker/Redis.
 * NOT for production — data lives only in memory and resets on restart, and
 * doesn't work across multiple server instances.
 */

type Entry = { value: string; expiresAt: number | null };

// Module-level singletons so every "connection" created in mock mode (the
// main client + any pub/sub subscribers) shares the same data and the same
// publish/subscribe bus, mirroring how multiple ioredis clients talk to one
// real Redis server.
const store = new Map<string, Entry>();
const bus = new EventEmitter();
bus.setMaxListeners(0);

function read(key: string): string | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${escaped}$`);
}

export class MemoryRedisConnection extends EventEmitter {
  private channelListeners = new Map<string, (message: string) => void>();

  async get(key: string): Promise<string | null> {
    return read(key);
  }

  async set(key: string, value: string, ...args: (string | number)[]): Promise<"OK" | null> {
    let ttlMs: number | null = null;
    let nx = false;

    for (let i = 0; i < args.length; i++) {
      const flag = String(args[i]).toUpperCase();
      if (flag === "EX") ttlMs = Number(args[++i]) * 1000;
      else if (flag === "PX") ttlMs = Number(args[++i]);
      else if (flag === "NX") nx = true;
    }

    if (nx && read(key) !== null) return null;

    store.set(key, { value, expiresAt: ttlMs !== null ? Date.now() + ttlMs : null });
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) if (store.delete(key)) deleted++;
    return deleted;
  }

  async incr(key: string): Promise<number> {
    const next = Number(read(key) ?? "0") + 1;
    const existing = store.get(key);
    store.set(key, { value: String(next), expiresAt: existing?.expiresAt ?? null });
    return next;
  }

  async expire(key: string, seconds: number): Promise<0 | 1> {
    const entry = store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = store.get(key);
    if (!entry) return -2;
    if (entry.expiresAt === null) return -1;
    return Math.max(0, Math.round((entry.expiresAt - Date.now()) / 1000));
  }

  /** Only supports the compare-and-delete script used by lib/lock.ts. */
  async eval(_script: string, _numKeys: number, key: string, token: string): Promise<0 | 1> {
    if (read(key) === token) {
      store.delete(key);
      return 1;
    }
    return 0;
  }

  scanStream(opts: { match?: string; count?: number } = {}): AsyncIterable<string[]> {
    const matcher = globToRegExp(opts.match ?? "*");
    const keys = Array.from(store.keys()).filter((k) => matcher.test(k));
    const chunkSize = opts.count ?? 100;

    return (async function* () {
      for (let i = 0; i < keys.length; i += chunkSize) {
        yield keys.slice(i, i + chunkSize);
      }
    })();
  }

  async publish(channel: string, message: string): Promise<number> {
    bus.emit(channel, message);
    return bus.listenerCount(channel);
  }

  async subscribe(channel: string): Promise<number> {
    const listener = (message: string) => this.emit("message", channel, message);
    this.channelListeners.set(channel, listener);
    bus.on(channel, listener);
    return 1;
  }

  async unsubscribe(channel?: string): Promise<number> {
    const targets = channel ? [channel] : Array.from(this.channelListeners.keys());
    for (const ch of targets) {
      const listener = this.channelListeners.get(ch);
      if (listener) bus.off(ch, listener);
      this.channelListeners.delete(ch);
    }
    return targets.length;
  }

  async quit(): Promise<"OK"> {
    await this.unsubscribe();
    return "OK";
  }

  disconnect(): void {
    void this.unsubscribe();
  }
}
