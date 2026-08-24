/**
 * Thin wrapper around the Discord REST API using a *bot* token.
 *
 * This is separate from lib/discordOAuth.ts (which only identifies a staff
 * member so they can link their account) and from lib/discord.ts (which reads
 * the public widget). Sending DMs or posting in a channel is only possible
 * with a bot, so everything here needs DISCORD_BOT_TOKEN and the bot must be
 * a member of the guild configured in the dashboard.
 */

const API = "https://discord.com/api/v10";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export function isBotConfigured(): boolean {
  return Boolean(BOT_TOKEN);
}

/** A Discord API error we can surface to staff instead of a raw 4xx. */
export class DiscordApiError extends Error {
  constructor(
    readonly status: number,
    /** Discord's own numeric error code, e.g. 50007 "Cannot send messages to this user". */
    readonly code: number | null,
    message: string
  ) {
    super(message);
    this.name = "DiscordApiError";
  }
}

/**
 * Authenticated fetch against the Discord API. Retries once on 429 using the
 * `retry_after` Discord gives us — beyond that we give up rather than block
 * the staff member's request for seconds.
 */
async function botFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (!BOT_TOKEN) throw new DiscordApiError(0, null, "DISCORD_BOT_TOKEN non configurato");

  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (res.status === 429 && retry) {
    const body = (await res.json().catch(() => ({}))) as { retry_after?: number };
    const waitMs = Math.min(Math.ceil((body.retry_after ?? 1) * 1000), 5000);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return botFetch<T>(path, init, false);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { code?: number; message?: string }
      | null;
    throw new DiscordApiError(
      res.status,
      body?.code ?? null,
      body?.message ?? `Discord API ${res.status}`
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------------------------------------------------------------- targets

export type BotGuild = { id: string; name: string; icon: string | null };
export type BotChannel = { id: string; name: string; type: number; position: number };

/** Guilds the bot itself is in — used to populate the server picker. */
export async function listBotGuilds(): Promise<BotGuild[]> {
  const guilds = await botFetch<BotGuild[]>("/users/@me/guilds");
  return guilds.map((g) => ({ id: g.id, name: g.name, icon: g.icon ?? null }));
}

// Channel types the bot can post text messages into.
const TEXT_CHANNEL_TYPES = new Set([0, 5, 10, 11, 12, 15]);

export async function listGuildTextChannels(guildId: string): Promise<BotChannel[]> {
  const channels = await botFetch<BotChannel[]>(`/guilds/${guildId}/channels`);
  return channels
    .filter((c) => TEXT_CHANNEL_TYPES.has(c.type))
    .map((c) => ({ id: c.id, name: c.name, type: c.type, position: c.position ?? 0 }))
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------- messages

export type DiscordEmbed = {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
};

export type MessagePayload = {
  content?: string;
  embeds?: DiscordEmbed[];
  /** Whitelist of pingable users. Omitted = nothing gets pinged. */
  allowed_mentions?: { parse: never[]; users?: string[] };
};

export async function sendChannelMessage(channelId: string, payload: MessagePayload) {
  await botFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    // Default to "ping nobody" so a name inside an embed can never turn into
    // an @everyone/@role notification.
    body: JSON.stringify({ allowed_mentions: { parse: [] }, ...payload }),
  });
}

/**
 * Opens (or reuses) the DM channel with a user and posts there. Throws with
 * code 50007 when the user has DMs closed or shares no server with the bot —
 * callers turn that into a "DM non recapitato" hint for staff.
 */
export async function sendDirectMessage(userId: string, payload: MessagePayload) {
  const channel = await botFetch<{ id: string }>("/users/@me/channels", {
    method: "POST",
    body: JSON.stringify({ recipient_id: userId }),
  });

  await sendChannelMessage(channel.id, payload);
}

// ---------------------------------------------------------------- resolving

type GuildMember = {
  nick: string | null;
  user: { id: string; username: string; global_name: string | null };
};

const SNOWFLAKE = /^\d{17,20}$/;

/** True when the string is already a raw Discord user ID. */
export function isSnowflake(value: string): boolean {
  return SNOWFLAKE.test(value.trim());
}

/**
 * Normalises what people actually type into the "Discord" field: a leading
 * `@`, the legacy `#1234` discriminator, surrounding spaces.
 */
function normaliseHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").replace(/#\d{4}$/, "").trim().toLowerCase();
}

/**
 * Turns a Discord handle into a user ID by searching the guild's member list.
 * Returns null when we can't be *sure* who it is — we'd rather tell staff the
 * DM couldn't be sent than message a random member with a similar name.
 *
 * Requires the "Server Members Intent" to be enabled for the bot in the
 * Discord developer portal.
 */
export async function resolveDiscordUserId(
  guildId: string,
  handle: string
): Promise<string | null> {
  const raw = handle.trim().replace(/^<@!?(\d+)>$/, "$1");
  if (isSnowflake(raw)) return raw;

  const query = normaliseHandle(raw);
  if (query.length < 2) return null;

  const members = await botFetch<GuildMember[]>(
    `/guilds/${guildId}/members/search?query=${encodeURIComponent(query)}&limit=10`
  );

  const exact = members.find((m) =>
    [m.user.username, m.user.global_name, m.nick]
      .filter(Boolean)
      .some((name) => name!.toLowerCase() === query)
  );
  if (exact) return exact.user.id;

  // A single candidate is unambiguous enough to trust; two or more names that
  // merely start with the query are not.
  if (members.length === 1) return members[0].user.id;

  return null;
}
