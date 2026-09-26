/**
 * Decision notifications: when staff approves/rejects a staff application or a
 * ban appeal we DM the person and post the outcome in a results channel.
 *
 * Where things live:
 *  - the bot token is an env secret (DISCORD_BOT_TOKEN), never in the DB;
 *  - guild/channel selection + toggles are a SiteSettings row (`discord_notify`)
 *    edited from /dashboard/settings, so they can be changed without a redeploy.
 */

import { SITE } from "./constants";
import { getSetting } from "./settings";
import { APPLY_COOLDOWN_DAYS } from "./applyCooldown";
import type { NotifyOutcome, SendResult } from "./notifyResult";
import {
  DiscordApiError,
  isBotConfigured,
  resolveDiscordUserId,
  sendChannelMessage,
  sendDirectMessage,
  type DiscordEmbed,
} from "./discordBot";

export const DISCORD_NOTIFY_KEY = "discord_notify";

export type DiscordNotifyConfig = {
  enabled: boolean;
  guildId: string;
  applicationsChannelId: string;
  appealsChannelId: string;
  dmApplications: boolean;
  dmAppeals: boolean;
  /** Staff notes are internal by default — opt in before echoing them to the player. */
  includeStaffNotes: boolean;
};

export const DEFAULT_NOTIFY_CONFIG: DiscordNotifyConfig = {
  enabled: false,
  guildId: "",
  applicationsChannelId: "",
  appealsChannelId: "",
  dmApplications: true,
  dmAppeals: true,
  includeStaffNotes: false,
};

export async function getDiscordNotifyConfig(): Promise<DiscordNotifyConfig> {
  const raw = await getSetting(DISCORD_NOTIFY_KEY);
  if (!raw) return DEFAULT_NOTIFY_CONFIG;
  try {
    return { ...DEFAULT_NOTIFY_CONFIG, ...(JSON.parse(raw) as Partial<DiscordNotifyConfig>) };
  } catch {
    return DEFAULT_NOTIFY_CONFIG;
  }
}

// ---------------------------------------------------------------- outcomes

export { describeOutcome } from "./notifyResult";
export type { SendResult, NotifyOutcome } from "./notifyResult";

const COLOR_APPROVED = 0x22c55e;
const COLOR_REJECTED = 0xef4444;

function truncate(text: string, max = 1000): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function trySend(fn: () => Promise<void>): Promise<{ ok: true } | { ok: false; result: SendResult; detail: string }> {
  try {
    await fn();
    return { ok: true };
  } catch (err) {
    if (err instanceof DiscordApiError) {
      // 50007 = "Cannot send messages to this user"
      const result: SendResult = err.code === 50007 ? "dm_closed" : "error";
      return { ok: false, result, detail: err.message };
    }
    return { ok: false, result: "error", detail: (err as Error).message };
  }
}

/**
 * Shared pipeline for both application and appeal decisions: resolve the
 * handle, DM the person, post to the results channel. Never throws — a Discord
 * outage must not roll back a decision the staff member already made.
 */
async function notifyDecision(opts: {
  handle: string | null;
  knownDiscordId: string | null;
  dmEnabled: boolean;
  channelId: string;
  dmEmbed: DiscordEmbed;
  channelEmbed: (mention: string | null) => DiscordEmbed;
}): Promise<NotifyOutcome> {
  const config = await getDiscordNotifyConfig();

  if (!config.enabled || !isBotConfigured() || !config.guildId) {
    return { dm: "disabled", channel: "disabled", discordId: opts.knownDiscordId };
  }

  // ---- who are we talking to
  let discordId = opts.knownDiscordId;
  let dm: SendResult = "disabled";
  const details: string[] = [];

  if (!discordId && opts.handle) {
    try {
      discordId = await resolveDiscordUserId(config.guildId, opts.handle);
    } catch (err) {
      details.push(`ricerca membro fallita: ${(err as Error).message}`);
      discordId = null;
    }
  }

  // ---- DM
  if (!opts.dmEnabled) {
    dm = "disabled";
  } else if (!opts.handle && !discordId) {
    dm = "no_handle";
  } else if (!discordId) {
    dm = "unresolved";
  } else {
    const sent = await trySend(() => sendDirectMessage(discordId!, { embeds: [opts.dmEmbed] }));
    if (sent.ok) {
      dm = "sent";
    } else {
      dm = sent.result;
      details.push(sent.detail);
    }
  }

  // ---- results channel
  let channel: SendResult = "disabled";
  if (opts.channelId) {
    const mention = discordId ? `<@${discordId}>` : null;
    const sent = await trySend(() =>
      sendChannelMessage(opts.channelId, {
        // A mention only pings when it's in `content` — inside an embed it just
        // renders as a name. Putting it here is what reaches someone whose DMs
        // are closed; allowed_mentions keeps it to that one person.
        ...(mention ? { content: mention } : {}),
        embeds: [opts.channelEmbed(mention)],
        allowed_mentions: { parse: [], ...(discordId ? { users: [discordId] } : {}) },
      })
    );
    if (sent.ok) {
      channel = "sent";
    } else {
      channel = sent.result === "dm_closed" ? "error" : sent.result;
      details.push(sent.detail);
    }
  }

  return { dm, channel, discordId, ...(details.length ? { detail: details.join(" · ") } : {}) };
}

// ---------------------------------------------------------------- applications

/** Sotto l'esito di una candidatura rifiutata: il limite di lib/applyCooldown.ts. */
const RETRY_TEXT = `Potrai riprovare la candidatura tra ${APPLY_COOLDOWN_DAYS} giorni.`;

export async function notifyApplicationDecision(application: {
  minecraftName: string;
  discord: string;
  discordId: string | null;
  roles: string;
  status: "APPROVED" | "REJECTED";
  reviewerName: string;
}): Promise<NotifyOutcome> {
  const config = await getDiscordNotifyConfig();
  const approved = application.status === "APPROVED";

  const dmEmbed: DiscordEmbed = {
    title: approved ? "Candidatura accettata" : "Candidatura rifiutata",
    description: approved
      ? `Ciao **${application.minecraftName}**, la tua candidatura per **${application.roles}** su ${SITE.name} è stata **accettata**! Prossimo passo: apri un ticket nel Discord del server per sostenere la **candidatura orale** — un responsabile ti contatterà lì per fissarla.`
      : `Ciao **${application.minecraftName}**, la tua candidatura per **${application.roles}** su ${SITE.name} è stata **rifiutata**. Grazie comunque per l'interesse.`,
    color: approved ? COLOR_APPROVED : COLOR_REJECTED,
    fields: [
      { name: "Ruolo richiesto", value: application.roles, inline: true },
      { name: "Esito", value: approved ? "Accettata" : "Rifiutata", inline: true },
      ...(approved ? [] : [{ name: "Nuovo tentativo", value: RETRY_TEXT }]),
    ],
    footer: { text: `${SITE.name} · Staff Team` },
    timestamp: new Date().toISOString(),
  };

  return notifyDecision({
    handle: application.discord || null,
    knownDiscordId: application.discordId,
    dmEnabled: config.dmApplications,
    channelId: config.applicationsChannelId,
    dmEmbed,
    channelEmbed: (mention) => ({
      title: `Esito candidatura — ${application.minecraftName}`,
      color: approved ? COLOR_APPROVED : COLOR_REJECTED,
      fields: [
        { name: "Giocatore", value: application.minecraftName, inline: true },
        { name: "Ruolo", value: application.roles, inline: true },
        { name: "Esito", value: approved ? "✅ Accettata" : "❌ Rifiutata", inline: true },
        { name: "Discord", value: mention ?? application.discord, inline: true },
        { name: "Revisionata da", value: application.reviewerName, inline: true },
        ...(approved
          ? [{ name: "Prossimi passi", value: "Aprire un ticket per la candidatura orale" }]
          : [{ name: "Nuovo tentativo", value: RETRY_TEXT }]),
      ],
      footer: { text: `${SITE.name} · Candidature staff` },
      timestamp: new Date().toISOString(),
    }),
  });
}

// ---------------------------------------------------------------- appeals

export async function notifyAppealDecision(appeal: {
  minecraftName: string;
  discord: string | null;
  discordId: string | null;
  banId: string | null;
  staffNotes: string | null;
  status: "APPROVED" | "DENIED";
  reviewerName: string;
}): Promise<NotifyOutcome> {
  const config = await getDiscordNotifyConfig();
  const approved = appeal.status === "APPROVED";
  const notes = config.includeStaffNotes && appeal.staffNotes ? appeal.staffNotes.trim() : "";

  const dmEmbed: DiscordEmbed = {
    title: approved ? "Ban appeal accettato" : "Ban appeal rifiutato",
    description: approved
      ? `Ciao **${appeal.minecraftName}**, il tuo appeal su ${SITE.name} è stato **accettato**: la sanzione è stata rimossa. Puoi rientrare su \`${SITE.serverIp}\`.`
      : `Ciao **${appeal.minecraftName}**, il tuo appeal su ${SITE.name} è stato **rifiutato**: la sanzione resta attiva.`,
    color: approved ? COLOR_APPROVED : COLOR_REJECTED,
    fields: [
      ...(appeal.banId ? [{ name: "Ban ID", value: appeal.banId, inline: true }] : []),
      { name: "Esito", value: approved ? "Accettato" : "Rifiutato", inline: true },
      ...(notes ? [{ name: "Nota dello staff", value: truncate(notes) }] : []),
    ],
    footer: { text: `${SITE.name} · Staff Team` },
    timestamp: new Date().toISOString(),
  };

  return notifyDecision({
    handle: appeal.discord,
    knownDiscordId: appeal.discordId,
    dmEnabled: config.dmAppeals,
    channelId: config.appealsChannelId,
    dmEmbed,
    channelEmbed: (mention) => ({
      title: `Esito appeal — ${appeal.minecraftName}`,
      color: approved ? COLOR_APPROVED : COLOR_REJECTED,
      fields: [
        { name: "Giocatore", value: appeal.minecraftName, inline: true },
        { name: "Ban ID", value: appeal.banId ?? "—", inline: true },
        { name: "Esito", value: approved ? "✅ Accettato" : "❌ Rifiutato", inline: true },
        { name: "Discord", value: mention ?? appeal.discord ?? "—", inline: true },
        { name: "Revisionato da", value: appeal.reviewerName, inline: true },
      ],
      footer: { text: `${SITE.name} · Ban appeal` },
      timestamp: new Date().toISOString(),
    }),
  });
}

