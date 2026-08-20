import { cookies } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { randomBytes } from "crypto";
import { redis, keys } from "./redis";
import type { Role } from "@prisma/client";

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "venrix_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "";

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  // Fail loudly in dev instead of silently issuing insecure cookies.
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.warn(
      "[session] SESSION_SECRET is missing or shorter than 32 chars — set it in .env"
    );
  }
}

export type SessionData = {
  userId: string;
  username: string;
  role: Role;
};

/**
 * Sessions are split in two: the browser cookie only carries an opaque,
 * iron-session-sealed session id. The actual payload (userId, role, ...)
 * lives in Redis under venrix:session:{sessionId} with a 24h TTL, so a
 * session can be revoked instantly (logout, ban, role change) by deleting
 * the Redis key without needing to rotate cookie secrets.
 */
export async function createSession(data: SessionData): Promise<void> {
  const sessionId = randomBytes(32).toString("hex");

  await redis.set(
    keys.session(sessionId),
    JSON.stringify(data),
    "EX",
    SESSION_TTL_SECONDS
  );

  const sealed = await sealData(
    { sid: sessionId },
    { password: SESSION_SECRET, ttl: SESSION_TTL_SECONDS }
  );

  cookies().set(COOKIE_NAME, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const { sid } = await unsealData<{ sid: string }>(raw, {
      password: SESSION_SECRET,
      ttl: SESSION_TTL_SECONDS,
    });
    if (!sid) return null;

    const stored = await redis.get(keys.session(sid));
    if (!stored) return null;

    // Sliding expiration: touch TTL on each read.
    await redis.expire(keys.session(sid), SESSION_TTL_SECONDS);

    return JSON.parse(stored) as SessionData;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (raw) {
    try {
      const { sid } = await unsealData<{ sid: string }>(raw, {
        password: SESSION_SECRET,
        ttl: SESSION_TTL_SECONDS,
      });
      if (sid) await redis.del(keys.session(sid));
    } catch {
      // ignore malformed cookie
    }
  }
  cookies().delete(COOKIE_NAME);
}

/**
 * Deletes every live session belonging to a user (across all devices) —
 * used when a role/active flag/password changes so stale sessions can't
 * keep using old privileges or a superseded password.
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  const stream = redis.scanStream({ match: keys.session("*"), count: 100 });
  for await (const chunk of stream) {
    for (const key of chunk as string[]) {
      const raw = await redis.get(key);
      if (raw && JSON.parse(raw).userId === userId) await redis.del(key);
    }
  }
}

/**
 * Patches the current request's session payload in place (e.g. after a
 * self-service username change) so the UI stays consistent without forcing
 * a re-login.
 */
export async function patchCurrentSession(patch: Partial<SessionData>): Promise<void> {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return;

  try {
    const { sid } = await unsealData<{ sid: string }>(raw, {
      password: SESSION_SECRET,
      ttl: SESSION_TTL_SECONDS,
    });
    if (!sid) return;

    const stored = await redis.get(keys.session(sid));
    if (!stored) return;

    const current = JSON.parse(stored) as SessionData;
    const ttl = await redis.ttl(keys.session(sid));
    await redis.set(
      keys.session(sid),
      JSON.stringify({ ...current, ...patch }),
      "EX",
      ttl > 0 ? ttl : SESSION_TTL_SECONDS
    );
  } catch {
    // ignore malformed cookie
  }
}
