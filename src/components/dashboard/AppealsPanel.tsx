"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type Appeal = {
  id: string;
  minecraftName: string;
  uuid: string | null;
  banId: string | null;
  banReason: string | null;
  message: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  staffNotes: string | null;
  createdAt: string;
  reviewedBy: { username: string } | null;
};

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

function formatSanctionStatus(r: LiteBansRecord) {
  if (r.removedBy) return `Rimossa da ${r.removedBy}`;
  if (r.until === null) return r.type === "kick" ? "—" : "Permanente";
  if (r.until <= Date.now()) return "Scaduta";
  return r.active ? "Attiva" : "Non attiva";
}

export function AppealsPanel({ canDelete }: { canDelete: boolean }) {
  const [items, setItems] = useState<Appeal[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [player, setPlayer] = useState("");
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Appeal | null>(null);
  const [notes, setNotes] = useState("");
  const [liteBans, setLiteBans] = useState<{ configured: boolean; records: LiteBansRecord[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    if (player) params.set("player", player);

    const res = await fetch(`/api/appeals?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [page, status, player]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, newStatus: Appeal["status"], staffNotes?: string) {
    await fetch(`/api/appeals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, ...(staffNotes !== undefined ? { staffNotes } : {}) }),
    });
    setActive(null);
    load();
  }

  async function removeAppeal(id: string) {
    if (!confirm("Eliminare definitivamente questo appeal?")) return;
    await fetch(`/api/appeals/${id}`, { method: "DELETE" });
    setActive(null);
    load();
  }

  function openAppeal(appeal: Appeal) {
    setActive(appeal);
    setNotes(appeal.staffNotes ?? "");
    setLiteBans(null);

    // Prefer an exact lookup by the ban ID the player gave us; fall back to
    // a name search (their most recent sanctions) when no ID was provided.
    const query = appeal.banId
      ? `id=${encodeURIComponent(appeal.banId)}`
      : `player=${encodeURIComponent(appeal.minecraftName)}`;

    fetch(`/api/litebans?${query}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setLiteBans(data));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="venrix-label">Stato</label>
          <select
            className="venrix-input"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">Tutti</option>
            <option value="PENDING">In attesa</option>
            <option value="APPROVED">Approvati</option>
            <option value="DENIED">Rifiutati</option>
          </select>
        </div>
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
      </div>

      <div className="venrix-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Giocatore</th>
              <th className="px-4 py-3">Ban ID</th>
              <th className="px-4 py-3">Motivo ban</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Revisionato da</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Azioni</th>
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
                  Nessun appeal trovato.
                </td>
              </tr>
            ) : (
              items.map((appeal) => (
                <tr key={appeal.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-white">{appeal.minecraftName}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{appeal.banId ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{appeal.banReason ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(appeal.status)}>{appeal.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{appeal.reviewedBy?.username ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(appeal.createdAt).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      className="text-sm font-semibold text-venrix-300 hover:text-venrix-200"
                      onClick={() => openAppeal(appeal)}
                    >
                      Gestisci
                    </button>
                    {canDelete && (
                      <button
                        className="text-sm font-semibold text-red-400 hover:text-red-300"
                        onClick={() => removeAppeal(appeal.id)}
                      >
                        Elimina
                      </button>
                    )}
                  </td>
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

      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={`Appeal di ${active?.minecraftName ?? ""}`}>
        {active && (
          <div className="space-y-4">
            {active.reviewedBy && (
              <div>
                <p className="venrix-label">Stato attuale</p>
                <p className="text-sm text-slate-300">
                  <Badge tone={statusTone(active.status)}>{active.status}</Badge>{" "}
                  <span className="text-slate-400">da {active.reviewedBy.username}</span>
                </p>
              </div>
            )}
            {active.banId && (
              <div>
                <p className="venrix-label">Ban ID indicato dal giocatore</p>
                <p className="font-mono text-sm text-slate-300">{active.banId}</p>
              </div>
            )}
            <div>
              <p className="venrix-label">Messaggio del giocatore</p>
              <p className="rounded-lg bg-ink-800 p-3 text-sm text-slate-300">{active.message}</p>
            </div>
            {liteBans?.configured && (
              <div>
                <p className="venrix-label">
                  {active.banId ? "Sanzione referenziata (LiteBans)" : "Storico sanzioni (LiteBans)"}
                </p>
                {liteBans.records.length === 0 ? (
                  <p className="text-xs text-slate-500">Nessuna sanzione trovata.</p>
                ) : (
                  <ul className="space-y-2 rounded-lg bg-ink-800 p-3 text-xs text-slate-300">
                    {liteBans.records.map((r) => (
                      <li key={`${r.type}-${r.id}`} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold uppercase text-venrix-300">
                            #{r.id} · {r.type}
                          </span>
                          <span className="text-slate-500">{formatSanctionStatus(r)}</span>
                        </div>
                        <p className="mt-1">{r.reason ?? "Nessun motivo indicato"}</p>
                        <p className="mt-1 text-slate-500">
                          Staff: {r.staff ?? "—"} · {new Date(r.time).toLocaleString("it-IT")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div>
              <label className="venrix-label" htmlFor="staffNotes">
                Note staff
              </label>
              <textarea
                id="staffNotes"
                className="venrix-input resize-none"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => updateStatus(active.id, "APPROVED", notes)}>
                Approva
              </Button>
              <Button variant="danger" onClick={() => updateStatus(active.id, "DENIED", notes)}>
                Rifiuta
              </Button>
              <Button variant="secondary" onClick={() => updateStatus(active.id, "PENDING", notes)}>
                Salva note
              </Button>
              {canDelete && (
                <Button variant="danger" onClick={() => removeAppeal(active.id)} className="ml-auto">
                  Elimina definitivamente
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
