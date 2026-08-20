"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { PixelFrame, IconSearch } from "@/components/icons";

type LiteBansRecord = {
  id: number;
  type: "ban" | "mute" | "warn" | "kick";
  player: string;
  reason: string | null;
  staff: string | null;
  removedBy: string | null;
  removedReason: string | null;
  time: number;
  until: number | null;
  active: boolean;
};

const TYPE_TONE: Record<LiteBansRecord["type"], "denied" | "pending" | "neutral" | "role"> = {
  ban: "denied",
  mute: "pending",
  warn: "neutral",
  kick: "role",
};

function formatStatus(r: LiteBansRecord) {
  if (r.removedBy) return `Rimossa da ${r.removedBy}`;
  if (r.until === null) return r.type === "kick" ? "—" : "Permanente";
  if (r.until <= Date.now()) return "Scaduta";
  return r.active ? "Attiva" : "Non attiva";
}

export function LiteBansPanel() {
  const [items, setItems] = useState<LiteBansRecord[]>([]);
  const [configured, setConfigured] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [player, setPlayer] = useState("");
  const [type, setType] = useState("all");
  const [staff, setStaff] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (player) params.set("player", player);
    if (type && type !== "all") params.set("type", type);
    if (staff) params.set("staff", staff);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await fetch(`/api/litebans?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setConfigured(data.configured);
      setItems(data.records);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, player, type, staff, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  if (!loading && !configured) {
    return (
      <div className="venrix-card flex flex-col items-center gap-3 p-10 text-center">
        <PixelFrame className="h-12 w-12 text-slate-500">
          <IconSearch className="h-6 w-6" />
        </PixelFrame>
        <p className="font-display text-xs text-white">LiteBans non configurato</p>
        <p className="max-w-sm text-sm text-slate-400">
          Imposta <code className="text-venrix-300">LITEBANS_DATABASE_URL</code> nel file{" "}
          <code className="text-venrix-300">.env</code> per collegare il database del plugin
          LiteBans e vedere qui tutte le sanzioni.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="venrix-label">Giocatore</label>
          <input
            className="venrix-input"
            placeholder="Nome Minecraft"
            value={player}
            onChange={(e) => {
              setPage(1);
              setPlayer(e.target.value);
            }}
          />
        </div>
        <div>
          <label className="venrix-label">Tipo</label>
          <select
            className="venrix-input"
            value={type}
            onChange={(e) => {
              setPage(1);
              setType(e.target.value);
            }}
          >
            <option value="all">Tutti</option>
            <option value="ban">Ban</option>
            <option value="mute">Mute</option>
            <option value="warn">Warn</option>
            <option value="kick">Kick</option>
          </select>
        </div>
        <div>
          <label className="venrix-label">Staff</label>
          <input
            className="venrix-input"
            placeholder="Nome staff"
            value={staff}
            onChange={(e) => {
              setPage(1);
              setStaff(e.target.value);
            }}
          />
        </div>
        <div>
          <label className="venrix-label">Dal</label>
          <input
            type="date"
            className="venrix-input"
            value={from}
            onChange={(e) => {
              setPage(1);
              setFrom(e.target.value);
            }}
          />
        </div>
        <div>
          <label className="venrix-label">Al</label>
          <input
            type="date"
            className="venrix-input"
            value={to}
            onChange={(e) => {
              setPage(1);
              setTo(e.target.value);
            }}
          />
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-500">{total} sanzioni trovate</p>

      <div className="venrix-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Giocatore</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Stato</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Caricamento...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Nessuna sanzione trovata.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={`${r.type}-${r.id}`} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-slate-500">#{r.id}</td>
                  <td className="px-4 py-3">
                    <Badge tone={TYPE_TONE[r.type]}>{r.type}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{r.player}</td>
                  <td className="px-4 py-3 text-slate-400">{r.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{r.staff ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(r.time).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatStatus(r)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm ${
                p === page ? "bg-venrix-600 text-white" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
