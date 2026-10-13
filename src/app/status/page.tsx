import type { Metadata } from "next";
import Link from "next/link";
import { getNetworkStatus, type ModeStatus } from "@/lib/siteStatus";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Stato server · VenrixMC",
  description: "Stato live del network VenrixMC: manutenzione, incidenti e stato di tutte le modalità.",
};

// La pagina non va congelata al build: i dati live passano dalla cache Redis.
export const dynamic = "force-dynamic";

function ModeCard({ mode }: { mode: ModeStatus }) {
  const maintenance = mode.manual === "maintenance";
  /*
   * La scheda del proxy mostra lo stesso numero del riquadro in cima: e' il
   * totale, non una modalita' in cui si gioca. Senza etichetta sembrerebbe
   * un undicesimo server con piu' gente di tutti gli altri messi insieme.
   */
  const isProxy = mode.proxy ?? mode.slug === "network";
  const dot = maintenance ? "bg-amber-400" : mode.online ? "bg-emerald-400" : "bg-red-500";
  const label = maintenance ? "Manutenzione" : mode.online ? "Online" : "Offline";
  const labelColor = maintenance
    ? "text-amber-500"
    : mode.online
      ? "text-emerald-500"
      : "text-red-500";

  return (
    <div className="venrix-card p-5">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-3 w-3">
          {mode.online && !maintenance && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-sm bg-emerald-400 opacity-60" />
          )}
          <span className={`relative inline-flex h-3 w-3 rounded-sm ${dot}`} />
        </span>
        <h3 className="font-display text-base font-semibold text-white">{mode.name}</h3>
        {isProxy && (
          <span className="mono-label rounded-full bg-white/8 px-2 py-0.5 text-slate-500">
            totale
          </span>
        )}
        <span className={`ml-auto text-[11px] font-bold uppercase tracking-[0.12em] ${labelColor}`}>
          {label}
          {mode.manual && mode.manual !== "maintenance" && (
            <span className="ml-1 normal-case tracking-normal text-slate-500">(manuale)</span>
          )}
        </span>
      </div>
      <div className="mt-3 text-sm">
        <p className="text-slate-400">
          {maintenance ? (
            "Lavori in corso, torna presto"
          ) : mode.online ? (
            <>
              <strong className="text-white">{mode.playersOnline}</strong> / {mode.playersMax}{" "}
              online
            </>
          ) : (
            "Server non raggiungibile"
          )}
        </p>
      </div>
    </div>
  );
}

export default async function StatusPage() {
  const { announcement, modes, totals } = await getNetworkStatus();
  const offline = modes.filter((m) => !m.online);
  /*
   * Il totale arriva da getNetworkTotals, NON da una somma delle modalita':
   * il proxy riporta gia' tutti i giocatori del network e i backend sono
   * la loro ripartizione, quindi sommarli li contava due volte a testa
   * (35 giocatori veri diventavano 70).
   */
  const totalPlayers = totals.playersOnline;

  const headline = announcement.enabled
    ? announcement.kind === "maintenance"
      ? "Manutenzione in corso"
      : announcement.kind === "incident"
        ? "Incidente tecnico"
        : "Avviso attivo"
    : offline.length === 0
      ? "Tutti i sistemi operativi"
      : "Alcune modalità offline";

  const headlineOk = !announcement.enabled && offline.length === 0;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-venrix-radial" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <span className="section-eyebrow">Stato network</span>
          <h1 className="section-title">Status</h1>
          <p className="section-lead">
            Stato live di tutte le modalità. Gioca su <span className="font-mono">play.venrixmc.uk</span>.
          </p>
        </header>

        <div
          className={`mt-8 flex flex-wrap items-center gap-3 rounded-sm border p-4 ${
            headlineOk
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-amber-500/30 bg-amber-500/10"
          }`}
        >
          <span className="relative flex h-3 w-3">
            {!headlineOk && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-sm bg-amber-400 opacity-60" />
            )}
            <span
              className={`relative inline-flex h-3 w-3 rounded-sm ${
                headlineOk ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
          </span>
          <p className="font-display text-base font-semibold text-white">{headline}</p>
          {announcement.enabled && announcement.message.trim() && (
            <p className="w-full text-sm text-slate-300">{announcement.message}</p>
          )}
          {!announcement.enabled && (
            <p className="w-full text-sm text-slate-400">
              <span className="tabular text-slate-300">{totalPlayers}</span>{" "}
              {totalPlayers === 1 ? "giocatore online" : "giocatori online"} nel network. Problemi?
              Segnalali sul{" "}
              <Link
                href={SITE.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-venrix-200 hover:underline"
              >
                Discord
              </Link>
              .
            </p>
          )}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modes.map((mode) => (
            <ModeCard key={mode.slug} mode={mode} />
          ))}
        </div>
      </div>
    </div>
  );
}
