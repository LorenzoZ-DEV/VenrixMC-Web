"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConsoleBadge } from "@/components/ConsoleBadge";
import { IconSearch, IconShield, PixelFrame } from "@/components/icons";
import { isConsoleName } from "@/lib/minecraft";

type BanRecord = {
  id: number;
  type: "ban" | "mute" | "warn" | "kick";
  uuid: string;
  player: string;
  reason: string | null;
  staff: string | null;
  removedBy: string | null;
  removedReason: string | null;
  time: number;
  until: number | null;
  active: boolean;
  displayId: string | null;
};

const TYPE_TONE: Record<BanRecord["type"], "denied" | "pending" | "neutral" | "role"> = {
  ban: "denied",
  mute: "pending",
  warn: "neutral",
  kick: "role",
};

const TYPE_LABEL: Record<BanRecord["type"], string> = {
  ban: "Ban",
  mute: "Mute",
  warn: "Warn",
  kick: "Kick",
};

type BanType = BanRecord["type"] | "all";

const TABS: { value: BanType; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "ban", label: "Ban" },
  { value: "mute", label: "Mute" },
  { value: "warn", label: "Warn" },
  { value: "kick", label: "Kick" },
];

const STAFF_VERB: Record<BanRecord["type"], string> = {
  ban: "Bannato da",
  mute: "Mutato da",
  warn: "Warnato da",
  kick: "Kikkato da",
};

const avatar = (uuid: string, size: number) =>
  `https://mc-heads.net/avatar/${encodeURIComponent(uuid)}/${size}`;

const avatarByName = (name: string, size: number) =>
  `https://mc-heads.net/avatar/${encodeURIComponent(name)}/${size}`;

function StaffHead({ name, size = 24 }: { name: string | null; size?: number }) {
  if (!name) return <>-</>;
  if (isConsoleName(name)) return <ConsoleBadge />;
  return (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarByName(name, 48)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="rounded-sm"
        style={{ width: size, height: size }}
      />
      {name}
    </span>
  );
}

const bodyRender = (uuid: string) =>
  `https://mc-heads.net/body/${encodeURIComponent(uuid)}/120`;

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function expiryText(r: BanRecord): string {
  if (r.removedBy) return `Rimossa da ${r.removedBy}`;
  if (r.until === null) return r.type === "kick" ? "-" : "Permanente";
  if (r.until <= Date.now()) return "Scaduta";
  return `Scade il ${formatDateTime(r.until)}`;
}

function statusText(r: BanRecord): string {
  if (r.removedBy) return "Rimossa";
  if (r.until === null) return r.type === "kick" ? "Eseguito" : "Attiva";
  if (r.until <= Date.now()) return "Scaduta";
  return r.active ? "Attiva" : "Non attiva";
}

/** Reason "blacklisted" (qualsiasi maiuscola) = giocatore in blacklist. */
function isBlacklisted(r: BanRecord): boolean {
  return (r.reason ?? "").trim().toLowerCase() === "blacklisted";
}

/** Badge nera/rossa per i blacklisted (sostituisce il badge del tipo). */
function BlacklistBadge() {
  return (
    <span className="inline-flex items-center rounded-sm border border-red-500/50 bg-black px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-red-500">
      Blacklist
    </span>
  );
}

export function BansExplorer() {
  const [items, setItems] = useState<BanRecord[]>([]);
  const [configured, setConfigured] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [player, setPlayer] = useState("");
  const [type, setType] = useState<BanType>("all");
  const [counts, setCounts] = useState<Record<BanType, number>>({
    all: 0,
    ban: 0,
    mute: 0,
    warn: 0,
    kick: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BanRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (player.trim()) params.set("player", player.trim());
      if (type !== "all") params.set("type", type);
      const res = await fetch(`/api/bans?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setConfigured(data.configured);
        setItems(data.records);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        if (data.counts) setCounts(data.counts);
      }
    } catch {
      // resta l'ultimo stato caricato
    }
    setLoading(false);
  }, [page, player, type]);

  useEffect(() => {
    load();
  }, [load]);

  if (!loading && !configured) {
    return (
      <div className="venrix-card flex flex-col items-center gap-3 p-10 text-center">
        <PixelFrame className="h-12 w-12 text-slate-500">
          <IconSearch className="h-6 w-6" />
        </PixelFrame>
        <p className="font-display text-base font-semibold text-white">Lista non disponibile</p>
        <p className="max-w-sm text-sm text-slate-400">
          La lista delle sanzioni non è ancora stata collegata.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <label className="venrix-label" htmlFor="bans-player">Giocatore</label>
          <input
            id="bans-player"
            className="venrix-input"
            placeholder="Cerca per nome..."
            value={player}
            onChange={(e) => {
              setPage(1);
              setPlayer(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Tipo di sanzione">
        {TABS.map((tab) => {
          const active = type === tab.value;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setPage(1);
                setType(tab.value);
              }}
              className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-venrix-500/50 bg-venrix-600 text-onbrand"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-venrix-500/40 hover:text-venrix-200"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-sm px-2 py-0.5 text-xs font-bold ${
                  active ? "bg-black/25 text-onbrand" : "bg-white/10 text-slate-400"
                }`}
              >
                {counts[tab.value]}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mb-3 text-xs text-slate-500">
        {total} {total === 1 ? "sanzione trovata" : "sanzioni trovate"}. Clicca su una riga per i dettagli
      </p>

      <div className="venrix-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Giocatore</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Stato</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Caricamento...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Nessuna sanzione trovata.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr
                  key={`${r.type}-${r.id}`}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2.5 font-medium text-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatar(r.uuid, 48)}
                        alt=""
                        width={28}
                        height={28}
                        loading="lazy"
                        className="h-7 w-7 rounded-sm"
                      />
                      {r.player}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isBlacklisted(r) ? (
                      <BlacklistBadge />
                    ) : (
                      <Badge tone={TYPE_TONE[r.type]}>{TYPE_LABEL[r.type]}</Badge>
                    )}
                  </td>
                  <td className="max-w-56 truncate px-4 py-3 text-slate-400">{r.reason ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-400">
                    <StaffHead name={r.staff} size={24} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                    {new Date(r.time).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400">{statusText(r)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 text-sm text-slate-300 hover:bg-white/10 disabled:text-slate-600"
          >
            Prec
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm ${
                p === page ? "bg-venrix-600 text-onbrand" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 text-sm text-slate-300 hover:bg-white/10 disabled:text-slate-600"
          >
            Succ
          </button>
        </div>
      )}

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Dettaglio sanzione">
        {selected && (
          <div>
            {isBlacklisted(selected) && (
              <div className="mb-5 flex items-start gap-3 rounded-sm border border-red-500/50 bg-black/60 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-red-500/50 bg-red-500/15 text-red-500">
                  <IconShield className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-[0.12em] text-red-500">
                    Blacklist
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    {selected.player} è stato inserito nella blacklist del network e non
                    potrà più rientrare nel server.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar(selected.uuid, 96)}
                alt={`Testa di ${selected.player}`}
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-sm"
              />
              <div>
                <p className="font-display text-lg font-semibold text-white">{selected.player}</p>
                <div className="mt-1.5">
                  {isBlacklisted(selected) ? (
                    <BlacklistBadge />
                  ) : (
                    <Badge tone={TYPE_TONE[selected.type]}>{TYPE_LABEL[selected.type]}</Badge>
                  )}
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bodyRender(selected.uuid)}
                alt=""
                width={60}
                height={90}
                loading="lazy"
                className="ml-auto hidden h-[90px] w-auto sm:block"
              />
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/5 pb-2.5">
                <dt className="text-slate-500">Motivo</dt>
                <dd className="text-right text-slate-200">{selected.reason ?? "-"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/5 pb-2.5">
                <dt className="text-slate-500">{STAFF_VERB[selected.type]}</dt>
                <dd className="text-right font-medium text-slate-200">
                  <StaffHead name={selected.staff} size={28} />
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/5 pb-2.5">
                <dt className="text-slate-500">Data</dt>
                <dd className="text-right text-slate-200">{formatDateTime(selected.time)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/5 pb-2.5">
                <dt className="text-slate-500">Scadenza</dt>
                <dd className="text-right text-slate-200">{expiryText(selected)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/5 pb-2.5">
                <dt className="text-slate-500">Stato</dt>
                <dd className="text-right text-slate-200">{statusText(selected)}</dd>
              </div>
              {selected.displayId && (
                <div className="flex justify-between gap-4 border-b border-white/5 pb-2.5">
                  <dt className="text-slate-500">Ban ID</dt>
                  <dd className="text-right font-mono text-slate-200">{selected.displayId}</dd>
                </div>
              )}
              {selected.removedBy && (
                <>
                  <div className="flex justify-between gap-4 border-b border-white/5 pb-2.5">
                    <dt className="text-slate-500">Rimossa da</dt>
                    <dd className="text-right text-slate-200">
                      <StaffHead name={selected.removedBy} size={24} />
                    </dd>
                  </div>
                  {selected.removedReason && (
                    <div className="flex justify-between gap-4 border-b border-white/5 pb-2.5">
                      <dt className="text-slate-500">Motivo rimozione</dt>
                      <dd className="text-right text-slate-200">{selected.removedReason}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>

            <button
              onClick={() => {
                setPlayer(selected.player);
                setPage(1);
                setSelected(null);
              }}
              className="venrix-btn-secondary mt-5 w-full"
            >
              Vedi lo storico di {selected.player}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
