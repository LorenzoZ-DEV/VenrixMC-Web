import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireApiRole } from "@/lib/auth";
import {
  DiscordApiError,
  isBotConfigured,
  listBotGuilds,
  listGuildTextChannels,
} from "@/lib/discordBot";

/**
 * Feeds the server/channel pickers in the Discord notifications panel:
 * the guilds the bot has been invited to, and — when a guild is selected —
 * the text channels it can post in. Not cached on purpose, so a freshly
 * invited bot shows up on the next refresh.
 */
export async function GET(req: NextRequest) {
  const auth = await requireApiRole(Role.DEVELOPER);
  if ("response" in auth) return auth.response;

  if (!isBotConfigured()) {
    return NextResponse.json({ configured: false, guilds: [], channels: [] });
  }

  const guildId = new URL(req.url).searchParams.get("guildId");

  try {
    const [guilds, channels] = await Promise.all([
      listBotGuilds(),
      guildId ? listGuildTextChannels(guildId) : Promise.resolve([]),
    ]);

    return NextResponse.json({ configured: true, guilds, channels });
  } catch (err) {
    const message =
      err instanceof DiscordApiError
        ? `Discord ha risposto ${err.status}: ${err.message}`
        : "Impossibile contattare Discord";
    return NextResponse.json({ configured: true, guilds: [], channels: [], error: message }, { status: 502 });
  }
}
