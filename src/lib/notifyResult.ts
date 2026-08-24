/**
 * Shape and wording of a Discord notification result. Kept apart from
 * lib/discordNotify.ts (which pulls in Prisma) so the dashboard client
 * components can import it too.
 */

/** Per-target result, reported back to the dashboard so staff sees what happened. */
export type SendResult =
  | "sent"
  | "disabled" // notifications off, or no channel/DM configured for this type
  | "no_handle" // we have no Discord handle for this person
  | "unresolved" // handle typed doesn't match anyone in the guild
  | "dm_closed" // user blocks DMs / shares no server with the bot
  | "error";

export type NotifyOutcome = {
  dm: SendResult;
  channel: SendResult;
  /** Snowflake we resolved, so the caller can cache it on the row. */
  discordId: string | null;
  detail?: string;
};

export const RESULT_LABELS: Record<SendResult, string> = {
  sent: "inviato",
  disabled: "non configurato",
  no_handle: "nessun Discord indicato",
  unresolved: "utente Discord non trovato nel server",
  dm_closed: "DM chiusi o nessun server in comune",
  error: "errore",
};

/** Human-readable summary used in the audit log and in the dashboard toast. */
export function describeOutcome(outcome: NotifyOutcome): string {
  const parts = [`DM: ${RESULT_LABELS[outcome.dm]}`, `canale: ${RESULT_LABELS[outcome.channel]}`];
  if (outcome.detail) parts.push(outcome.detail);
  return parts.join(" · ");
}

/** True when everything the config asked for actually went out. */
export function outcomeIsClean(outcome: NotifyOutcome): boolean {
  return outcome.dm !== "error" && outcome.dm !== "dm_closed" && outcome.dm !== "unresolved" && outcome.channel !== "error";
}
