import { cached, TTL } from "./cache";
import { keys } from "./redis";

export type DiscordWidget = {
  enabled: boolean;
  presenceCount: number;
};

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_SERVER_ID;

/**
 * Uses Discord's public widget.json endpoint (no bot token required —
 * the server owner just needs to enable "Server Widget" in Discord
 * settings). Falls back to disabled state if not configured/reachable.
 * Serve solo per il conteggio online: l'invito resta SITE.discordInvite,
 * perche' quello del widget e' generato da Discord e va fuori sincrono.
 */
export async function getDiscordWidget(): Promise<DiscordWidget> {
  if (!GUILD_ID) {
    return { enabled: false, presenceCount: 0 };
  }

  return cached(keys.cache("discord-widget", GUILD_ID), TTL.PLAYER_COUNT, async () => {
    try {
      const res = await fetch(
        `https://discord.com/api/guilds/${GUILD_ID}/widget.json`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`discord widget error ${res.status}`);
      const data = await res.json();

      return {
        enabled: true,
        presenceCount: data.presence_count ?? 0,
      } satisfies DiscordWidget;
    } catch {
      return { enabled: false, presenceCount: 0 };
    }
  });
}
