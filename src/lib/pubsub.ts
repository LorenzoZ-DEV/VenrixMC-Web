import { redis, createRedisConnection } from "./redis";

export const CHANNELS = {
  NEW_APPEAL: "venrix:events:new-appeal",
  NEW_APPLICATION: "venrix:events:new-application",
} as const;

export async function publishEvent(channel: string, payload: unknown) {
  await redis.publish(channel, JSON.stringify(payload));
}

/**
 * Opens a dedicated subscriber connection (pub/sub requires its own
 * connection separate from the general-purpose client) and invokes
 * `onMessage` for every message on `channel`. Returns an unsubscribe fn.
 */
export function subscribe(
  channel: string,
  onMessage: (payload: unknown) => void
): () => void {
  const sub = createRedisConnection();
  sub.subscribe(channel);
  sub.on("message", (ch, message) => {
    if (ch !== channel) return;
    try {
      onMessage(JSON.parse(message));
    } catch {
      onMessage(message);
    }
  });

  return () => {
    sub.unsubscribe(channel);
    sub.quit();
  };
}
