/**
 * Stato del network: annuncio globale (manutenzione/incidente) e stato live
 * delle modalità, interrogate via mcsrvstat. La configurazione vive in due
 * righe SiteSettings (`site_announcement`, `server_modes`) modificabili dalla
 * dashboard senza redeploy — qui ci sono solo default e letture cachate.
 */

import { getSetting } from "./settings";
import { cached, TTL } from "./cache";
import { keys } from "./redis";

export const ANNOUNCEMENT_KEY = "site_announcement";
export const MODES_KEY = "server_modes";

export type AnnouncementKind = "maintenance" | "incident" | "info";

export type Announcement = {
  enabled: boolean;
  kind: AnnouncementKind;
  message: string;
};

export const DEFAULT_ANNOUNCEMENT: Announcement = {
  enabled: false,
  kind: "info",
  message: "",
};

export async function getAnnouncement(): Promise<Announcement> {
  // Mai lanciare: il banner vive nel layout root e Next lo prerenderizza a
  // build-time con un DATABASE_URL finto — lì si torna il default spento.
  try {
    const raw = await getSetting(ANNOUNCEMENT_KEY);
    if (!raw) return DEFAULT_ANNOUNCEMENT;
    try {
      const parsed = JSON.parse(raw) as Partial<Announcement>;
      const kind: AnnouncementKind =
        parsed.kind === "maintenance" || parsed.kind === "incident" || parsed.kind === "info"
          ? parsed.kind
          : "info";
      return {
        enabled: Boolean(parsed.enabled),
        kind,
        message: typeof parsed.message === "string" ? parsed.message.slice(0, 500) : "",
      };
    } catch {
      return DEFAULT_ANNOUNCEMENT;
    }
  } catch {
    return DEFAULT_ANNOUNCEMENT;
  }
}

export type StatusOverride = "auto" | "online" | "offline" | "maintenance";

export type ServerMode = {
  slug: string;
  name: string;
  host: string;
  port: number;
  /** Override manuale dalla dashboard: con "auto" vale il ping live. */
  statusOverride?: StatusOverride;
  /**
   * Vero per il proxy (Velocity), falso per i backend dietro di esso.
   *
   * Conta perche' il proxy riporta gia' TUTTI i giocatori del network: i
   * backend sono la ripartizione degli stessi giocatori, non altri. Sommare
   * proxy e backend li conta due volte a testa.
   */
  proxy?: boolean;
};

/**
 * Il proxy quando la configurazione salvata non porta ancora il flag (tutte
 * le installazioni precedenti a questo campo). "network" e' lo slug che il
 * proxy ha da sempre in DEFAULT_MODES.
 */
function isProxyMode(mode: { slug: string; proxy?: boolean }): boolean {
  return mode.proxy ?? mode.slug === "network";
}

// Mappa reale dei backend (vedi velocity.toml sul VPS di gioco): il proxy è
// l'ingresso pubblico, gli altri sono interrogabili direttamente via query.
const MC_HOST = "178.218.144.74";

export const DEFAULT_MODES: ServerMode[] = [
  { slug: "network", name: "Network", host: "play.venrixmc.uk", port: 25565, proxy: true },
  { slug: "lobby", name: "Lobby", host: MC_HOST, port: 25566 },
  { slug: "lobby-2", name: "Lobby 2", host: MC_HOST, port: 25571 },
  { slug: "smp", name: "SMP", host: MC_HOST, port: 25570 },
  { slug: "sandbox", name: "Sandbox", host: MC_HOST, port: 25500 },
  { slug: "oneblock", name: "OneBlock", host: MC_HOST, port: 25567 },
  { slug: "vanillaplus", name: "Vanilla+", host: MC_HOST, port: 25568 },
  { slug: "jail", name: "Jail", host: MC_HOST, port: 25601 },
  { slug: "build", name: "Build", host: MC_HOST, port: 25561 },
  { slug: "screenshare", name: "Screenshare", host: MC_HOST, port: 25569 },
  { slug: "hg-lobby", name: "HG Lobby", host: MC_HOST, port: 25599 },
];

function sanitizeModes(raw: unknown): ServerMode[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length > 30) return null;
  const out: ServerMode[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const m = item as Record<string, unknown>;
    const override =
      m.statusOverride === "online" ||
      m.statusOverride === "offline" ||
      m.statusOverride === "maintenance" ||
      m.statusOverride === "auto"
        ? m.statusOverride
        : "auto";
    if (
      typeof m.slug !== "string" ||
      !/^[a-z0-9-]{1,30}$/.test(m.slug) ||
      typeof m.name !== "string" ||
      m.name.trim().length < 1 ||
      m.name.trim().length > 40 ||
      typeof m.host !== "string" ||
      m.host.trim().length < 1 ||
      m.host.trim().length > 100 ||
      typeof m.port !== "number" ||
      !Number.isInteger(m.port) ||
      m.port < 1 ||
      m.port > 65535
    ) {
      return null;
    }
    out.push({
      slug: m.slug,
      name: m.name.trim(),
      host: m.host.trim(),
      port: m.port,
      statusOverride: override,
      // Assente nelle configurazioni salvate prima di questo campo: si
      // ricade sullo slug storico del proxy.
      proxy: typeof m.proxy === "boolean" ? m.proxy : m.slug === "network",
    });
  }
  return out;
}

export async function getServerModes(): Promise<ServerMode[]> {
  // Come sopra: al build il DB non esiste, si torna la lista di default.
  try {
    const raw = await getSetting(MODES_KEY);
    if (!raw) return DEFAULT_MODES;
    try {
      return sanitizeModes(JSON.parse(raw)) ?? DEFAULT_MODES;
    } catch {
      return DEFAULT_MODES;
    }
  } catch {
    return DEFAULT_MODES;
  }
}

export type ModeStatus = ServerMode & {
  online: boolean;
  playersOnline: number;
  playersMax: number;
  /** Override manuale attivo (null = stato dal ping live). */
  manual: Exclude<StatusOverride, "auto"> | null;
};

/** Interroga una singola modalità via mcsrvstat (risultato cachato 30s). */
export async function getModeStatus(mode: ServerMode): Promise<ModeStatus> {
  const override = mode.statusOverride ?? "auto";
  // Override manuale: niente query, vale la scelta della dashboard.
  if (override !== "auto") {
    return {
      ...mode,
      online: override === "online",
      playersOnline: 0,
      playersMax: 0,
      manual: override,
    };
  }
  return cached(keys.cache("mode-status", `${mode.host}:${mode.port}`), TTL.PLAYER_COUNT, async () => {
    const base: ModeStatus = {
      ...mode,
      online: false,
      playersOnline: 0,
      playersMax: 0,
      manual: null,
    };
    try {
      const res = await fetch(`https://api.mcsrvstat.us/2/${mode.host}:${mode.port}`, {
        cache: "no-store",
      });
      if (!res.ok) return base;
      const data = await res.json();
      return {
        ...base,
        online: Boolean(data.online),
        playersOnline: data.players?.online ?? 0,
        playersMax: data.players?.max ?? 0,
      };
    } catch {
      return base;
    }
  });
}

export type NetworkTotals = {
  playersOnline: number;
  playersMax: number;
  /** Da dove arriva il numero: utile in debug, non si mostra a video. */
  source: "proxy" | "sum";
};

/**
 * Giocatori collegati al network, contati UNA volta sola.
 *
 * Il proxy conosce gia' il totale: e' l'ingresso da cui passano tutti, e la
 * sua query restituisce l'intero network. I backend (Lobby, SMP, Sandbox...)
 * riportano gli stessi giocatori suddivisi per destinazione, quindi vanno
 * letti come ripartizione e mai sommati al proxy.
 *
 * Se il proxy non risponde si ripiega sulla somma dei soli backend: e' il
 * meglio che si possa dire in quel momento, e li' la somma e' corretta
 * perche' un giocatore sta su un backend solo alla volta.
 */
export function getNetworkTotals(modes: ModeStatus[]): NetworkTotals {
  const proxy = modes.find((m) => isProxyMode(m) && m.online && !m.manual);
  if (proxy) {
    return { playersOnline: proxy.playersOnline, playersMax: proxy.playersMax, source: "proxy" };
  }

  const backends = modes.filter((m) => !isProxyMode(m) && m.online);
  return {
    playersOnline: backends.reduce((sum, m) => sum + m.playersOnline, 0),
    playersMax: backends.reduce((sum, m) => sum + m.playersMax, 0),
    source: "sum",
  };
}

export type NetworkStatus = {
  announcement: Announcement;
  modes: ModeStatus[];
  totals: NetworkTotals;
};

export async function getNetworkStatus(): Promise<NetworkStatus> {
  const [announcement, modes] = await Promise.all([getAnnouncement(), getServerModes()]);
  const live = await Promise.all(modes.map((m) => getModeStatus(m)));
  return { announcement, modes: live, totals: getNetworkTotals(live) };
}
