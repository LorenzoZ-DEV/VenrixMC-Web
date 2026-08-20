import { cached, TTL } from "./cache";
import { keys } from "./redis";

export type ServerStatus = {
  online: boolean;
  players: { online: number; max: number };
  version?: string;
  motd?: string[];
};

const SERVER_IP = process.env.NEXT_PUBLIC_SERVER_IP ?? "play.venrixmc.uk";
const API_URL =
  process.env.MCSRVSTAT_API_URL ?? `https://api.mcsrvstat.us/2/${SERVER_IP}`;

export async function getServerStatus(): Promise<ServerStatus> {
  return cached(keys.cache("mcsrvstat", SERVER_IP), TTL.PLAYER_COUNT, async () => {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`mcsrvstat error ${res.status}`);
      const data = await res.json();

      return {
        online: Boolean(data.online),
        players: {
          online: data.players?.online ?? 0,
          max: data.players?.max ?? 0,
        },
        version: data.version,
        motd: data.motd?.clean,
      } satisfies ServerStatus;
    } catch {
      return { online: false, players: { online: 0, max: 0 } } satisfies ServerStatus;
    }
  });
}
