/**
 * Nomi provenienti dai plugin Minecraft (es. LiteBans `banned_by_name`)
 * possono contenere codici di formattazione tipo `§4§lConsole`.
 */

/** Rimuove i codici di formattazione Minecraft (§ + carattere). */
export function stripMinecraftCodes(name: string): string {
  return name.replace(/§[0-9a-fk-or]/gi, "").trim();
}

/** Vero se il nome, una volta ripulito, e la Console del server. */
export function isConsoleName(name: string | null | undefined): boolean {
  if (!name) return false;
  return stripMinecraftCodes(name).toLowerCase() === "console";
}
