import { prisma } from "./prisma";
import { stripMinecraftCodes } from "./minecraft";
import { resolveMinecraftUuid } from "./mojang";

/**
 * Blacklist candidature staff.
 *
 * Una voce identifica una persona con uno qualsiasi fra UUID Minecraft, nick
 * e ID Discord. Basta che UNO dei dati combaci perche' la candidatura venga
 * rifiutata: chi e' in blacklist cambia nick, quindi affidarsi al solo nick
 * renderebbe la lista aggirabile in trenta secondi.
 *
 * Tutti i confronti avvengono su valori normalizzati (vedi sotto), mai sulla
 * stringa grezza digitata dallo staff.
 */

/** UUID senza trattini, minuscolo. `null` se non e' un UUID valido. */
export function normalizeUuid(value: string | null | undefined): string | null {
  if (!value) return null;
  const clean = value.trim().replace(/-/g, "").toLowerCase();
  return /^[0-9a-f]{32}$/.test(clean) ? clean : null;
}

/**
 * Nick minuscolo e ripulito dai codici di colore. In Minecraft il confronto
 * fra nick non distingue le maiuscole, e normalizzare in scrittura evita di
 * dipendere dalla collation del database.
 */
export function normalizeName(value: string | null | undefined): string | null {
  if (!value) return null;
  const clean = stripMinecraftCodes(value).trim().toLowerCase();
  return /^[a-z0-9_]{3,16}$/.test(clean) ? clean : null;
}

/** Snowflake Discord: solo cifre, 17-20 caratteri. */
export function normalizeDiscordId(value: string | null | undefined): string | null {
  if (!value) return null;
  const clean = value.trim();
  return /^\d{17,20}$/.test(clean) ? clean : null;
}

export type BlacklistMatch = {
  id: string;
  reason: string;
  /** Su quale dato e' scattato il blocco. Finisce nell'audit log, non a video. */
  matchedOn: "uuid" | "name" | "discord";
};

export type BlacklistLookup = {
  minecraftName?: string | null;
  discordId?: string | null;
  /** Gia' normalizzato. Se assente viene risolto dal nick via Mojang. */
  minecraftUuid?: string | null;
};

/**
 * Cerca una corrispondenza in blacklist. Restituisce `null` se la persona
 * puo' candidarsi.
 *
 * `resolveUuid` e' opzionale perche' comporta una chiamata a Mojang: la si
 * attiva dove il costo e' giustificato (invio della candidatura) e la si
 * lascia spenta dove serve solo una risposta immediata (rendering del gate,
 * che gira a ogni apertura della pagina).
 */
export async function findBlacklistMatch(
  lookup: BlacklistLookup,
  { resolveUuid = false }: { resolveUuid?: boolean } = {}
): Promise<BlacklistMatch | null> {
  const name = normalizeName(lookup.minecraftName);
  const discordId = normalizeDiscordId(lookup.discordId);
  let uuid = normalizeUuid(lookup.minecraftUuid);

  if (!uuid && resolveUuid && name) {
    uuid = await resolveMinecraftUuid(name);
  }

  // Nessun dato utilizzabile: non c'e' niente su cui decidere, e una query
  // con un OR vuoto restituirebbe la prima voce della tabella.
  const conditions = [
    uuid ? { minecraftUuid: uuid } : null,
    name ? { minecraftName: name } : null,
    discordId ? { discordId } : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null);

  if (conditions.length === 0) return null;

  const hit = await prisma.staffBlacklist.findFirst({
    where: { OR: conditions },
    select: { id: true, reason: true, minecraftUuid: true, minecraftName: true, discordId: true },
    orderBy: { createdAt: "desc" },
  });

  if (!hit) return null;

  // L'UUID e' il dato che non cambia: se ha combaciato quello, e' la
  // corrispondenza piu' forte e va riportata come tale nell'audit.
  const matchedOn: BlacklistMatch["matchedOn"] =
    uuid && hit.minecraftUuid === uuid
      ? "uuid"
      : discordId && hit.discordId === discordId
        ? "discord"
        : "name";

  return { id: hit.id, reason: hit.reason, matchedOn };
}
