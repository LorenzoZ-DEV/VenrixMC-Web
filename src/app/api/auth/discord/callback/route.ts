import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis, keys } from "@/lib/redis";
import { resolveDiscordUser, discordAvatarUrl } from "@/lib/discordOAuth";
import { logAudit } from "@/lib/audit";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/dashboard/profile?discord=error&reason=${reason}`, APP_URL));

  if (!code || !state) return fail("missing_params");

  const stateKey = keys.oauthState(state);
  const userId = await redis.get(stateKey);
  if (!userId) return fail("invalid_state");
  await redis.del(stateKey); // one-time use

  try {
    const discordUser = await resolveDiscordUser(code);

    const clash = await prisma.user.findUnique({ where: { discordId: discordUser.id } });
    if (clash && clash.id !== userId) return fail("already_linked");

    await prisma.user.update({
      where: { id: userId },
      data: {
        discordId: discordUser.id,
        discordUsername: discordUser.global_name ?? discordUser.username,
        discordAvatar: discordAvatarUrl(discordUser),
      },
    });

    await logAudit(userId, "PROFILE_DISCORD_LINK", `Account Discord collegato: ${discordUser.username}`);

    return NextResponse.redirect(new URL("/dashboard/profile?discord=linked", APP_URL));
  } catch {
    return fail("exchange_failed");
  }
}
