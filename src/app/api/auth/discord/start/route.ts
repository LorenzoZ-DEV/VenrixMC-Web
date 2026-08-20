import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/session";
import { redis, keys } from "@/lib/redis";
import { getDiscordAuthorizeUrl, isDiscordOAuthConfigured } from "@/lib/discordOAuth";

const STATE_TTL_SECONDS = 60 * 5;
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// GET — kicks off the Discord OAuth2 flow for the logged-in user. The
// `state` token is bound to this user's id in Redis (one-time, 5min TTL)
// so the callback can verify the redirect wasn't forged and knows which
// account to attach the Discord identity to.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", APP_URL));

  if (!isDiscordOAuthConfigured()) {
    return NextResponse.redirect(new URL("/dashboard/profile?discord=not_configured", APP_URL));
  }

  const state = randomBytes(24).toString("hex");
  await redis.set(keys.oauthState(state), session.userId, "EX", STATE_TTL_SECONDS);

  return NextResponse.redirect(getDiscordAuthorizeUrl(state));
}
