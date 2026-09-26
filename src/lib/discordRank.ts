import type { StaffRole } from "@prisma/client";
import { redis } from "./redis";
import { ROLE_ORDER } from "./team";
import { getDiscordNotifyConfig } from "./discordNotify";
import {
  DiscordApiError,
  getGuildMemberRoleIds,
  isBotConfigured,
  listBotGuilds,
  listGuildRoles,
  type GuildRole,
} from "./discordBot";

/**
 * Rank staff di un utente letto dai suoi ruoli sul server Discord.
 *
 * I ruoli del server si chiamano come i rank del sito ma con emoji e
 * varianti ("👑・Owner", "⚙️・SrDeveloper", "⛑️・Trial"): il confronto avviene
 * sul nome ripulito, cosi rinominare l'emoji di un ruolo non rompe nulla.
 * Ruoli che non corrispondono a nessun rank (Pluginner, Media...) si ignorano.
 */
const NAME_TO_RANK: Record<string, StaffRole> = {
  owner: "Owner",
  srdev: "SrDev",
  srdeveloper: "SrDev",
  dev: "Dev",
  developer: "Dev",
  jrdev: "JrDev",
  jrdeveloper: "JrDev",
  manager: "Manager",
  sradmin: "SrAdmin",
  admin: "Admin",
  srmod: "SrMod",
  srmoderator: "SrMod",
  "mod+": "ModPlus",
  modplus: "ModPlus",
  mod: "Mod",
  moderator: "Mod",
  srhelper: "SrHelper",
  helper: "Helper",
  trainee: "Trainee",
  trial: "Trainee",
  builder: "Builder",
};

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9+]/g, "");
}

export function rankFromRoleName(name: string): StaffRole | null {
  return NAME_TO_RANK[normalize(name)] ?? null;
}

/** Il server da interrogare: quello scelto nelle notifiche, o l'unico in cui sta il bot. */
async function resolveGuildId(): Promise<string | null> {
  const config = await getDiscordNotifyConfig();
  const configured = config.guildId || process.env.NEXT_PUBLIC_DISCORD_SERVER_ID;
  if (configured) return configured;

  const guilds = await listBotGuilds();
  return guilds.length === 1 ? guilds[0].id : null;
}

const ROLES_CACHE_SECONDS = 60 * 10;

// L'elenco dei ruoli cambia di rado ed e uguale per tutti: si tiene in cache
// per non fare una chiamata in piu a ogni login.
async function cachedGuildRoles(guildId: string): Promise<GuildRole[]> {
  const key = `discord:guild-roles:${guildId}`;
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as GuildRole[];

  const roles = await listGuildRoles(guildId);
  await redis.set(key, JSON.stringify(roles), "EX", ROLES_CACHE_SECONDS);
  return roles;
}

/**
 * Il rank piu alto tra i ruoli Discord dell'utente.
 *  - `StaffRole`: ha un ruolo staff;
 *  - `null`: controllato, nessun ruolo staff (o non e nel server);
 *  - `undefined`: impossibile controllare (bot non configurato, Discord giu).
 *    Chi chiama deve lasciare il valore salvato com'e invece di azzerarlo.
 */
export async function fetchDiscordRank(discordUserId: string): Promise<StaffRole | null | undefined> {
  if (!isBotConfigured()) return undefined;

  try {
    const guildId = await resolveGuildId();
    if (!guildId) return undefined;

    const memberRoles = await getGuildMemberRoleIds(guildId, discordUserId);
    if (!memberRoles) return null;

    const owned = new Set(memberRoles);
    const ranks = (await cachedGuildRoles(guildId))
      .filter((role) => owned.has(role.id))
      .map((role) => rankFromRoleName(role.name))
      .filter((rank): rank is StaffRole => rank !== null);

    if (!ranks.length) return null;
    return ranks.sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b))[0];
  } catch (err) {
    console.error(
      "[discordRank] lettura ruoli fallita:",
      err instanceof DiscordApiError ? `${err.status} ${err.message}` : err
    );
    return undefined;
  }
}
