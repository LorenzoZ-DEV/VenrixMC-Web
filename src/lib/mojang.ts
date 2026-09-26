import { cached, TTL } from "./cache";
import { keys } from "./redis";
import { stripMinecraftCodes } from "./minecraft";

/*
 * Solo server: questo modulo tocca Redis, quindi non deve mai finire nel
 * grafo di un componente client. Sta a parte da `minecraft.ts` proprio per
 * questo: quel file lo importano anche i pannelli della dashboard, e
 * trascinarci dentro ioredis rompe il bundle del browser.
 */

/**
 * Risolve un nick nel suo UUID tramite l'API pubblica di Mojang.
 *
 * Serve alla blacklist candidature: lo staff puo inserire un UUID, che e'
 * l'unico dato che non cambia quando un giocatore si rinomina, ma la
 * candidatura ci arriva con il solo nick. La risposta sta in cache 24h
 * perche' la coppia nick/UUID cambia raramente e Mojang ha un limite di
 * richieste stretto.
 *
 * Restituisce `null` se il nick non esiste o se Mojang non risponde: in quel
 * caso il controllo prosegue con nick e ID Discord, quindi un disservizio
 * esterno non lascia passare ne blocca nessuno per sbaglio.
 */
export async function resolveMinecraftUuid(name: string): Promise<string | null> {
  const clean = stripMinecraftCodes(name).toLowerCase();
  if (!/^[a-z0-9_]{3,16}$/.test(clean)) return null;

  return cached(keys.cache("mojang-uuid", clean), TTL.MOJANG_UUID, async () => {
    try {
      const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${clean}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      // 204/404 = il nick non esiste. Qualunque altro errore e' un
      // disservizio: in entrambi i casi non abbiamo un UUID da confrontare.
      if (!res.ok) return null;
      const data = (await res.json()) as { id?: string };
      return typeof data.id === "string" ? data.id.replace(/-/g, "").toLowerCase() : null;
    } catch {
      return null;
    }
  });
}
