"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { NotifyNotice, noticeFromOutcome, type Notice } from "@/components/dashboard/NotifyNotice";

type WizardAnswer = { section: string; question: string; answer: string };

type LiteBansRecord = {
  id: number;
  type: "ban" | "mute" | "warn" | "kick";
  reason: string | null;
  staff: string | null;
  time: number;
};

type Application = {
  id: string;
  minecraftName: string;
  discord: string;
  discordId: string | null;
  age: number;
  experience: string;
  roles: string;
  message: string;
  answers: WizardAnswer[] | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedBy: { username: string } | null;
};

function groupBySection(answers: WizardAnswer[]) {
  const groups: { section: string; items: WizardAnswer[] }[] = [];
  for (const a of answers) {
    let group = groups.find((g) => g.section === a.section);
    if (!group) {
      group = { section: a.section, items: [] };
      groups.push(group);
    }
    group.items.push(a);
  }
  return groups;
}

export function ApplicationsPanel() {
  const [items, setItems] = useState<Application[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [player, setPlayer] = useState("");
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Application | null>(null);
  const [discordId, setDiscordId] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [liteBans, setLiteBans] = useState<{ configured: boolean; records: LiteBansRecord[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    if (player) params.set("player", player);

    const res = await fetch(`/api/staff-apply?${params.toString()}`);
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

  async function updateStatus(id: string, newStatus: Application["status"]) {
    const res = await fetch(`/api/staff-apply/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, ...(discordId ? { discordId } : {}) }),
    });

    const data = res.ok ? await res.json().catch(() => null) : null;
    setNotice(
      res.ok
        ? noticeFromOutcome(data?.notify ?? null)
        : { tone: "warn", text: "Aggiornamento non riuscito." }
    );

    setActive(null);
    load();
  }

  function openApplication(app: Application) {
    setActive(app);
    setDiscordId(app.discordId ?? "");
    setNotice(null);
    setLiteBans(null);

    fetch(`/api/litebans?player=${encodeURIComponent(app.minecraftName)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setLiteBans(data));
  }

  return (
    <div>
      <NotifyNotice notice={notice} />

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
            <option value="APPROVED">Approvate</option>
            <option value="REJECTED">Rifiutate</option>
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
              <th className="px-4 py-3">Discord</th>
              <th className="px-4 py-3">Ruolo</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Caricamento...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Nessuna candidatura trovata.
                </td>
              </tr>
            ) : (
              items.map((app) => (
                <tr key={app.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-white">{app.minecraftName}</td>
                  <td className="px-4 py-3 text-slate-400">{app.discord}</td>
                  <td className="px-4 py-3 text-slate-400">{app.roles}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(app.status)}>{app.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-sm font-semibold text-venrix-300 hover:text-venrix-200"
                      onClick={() => openApplication(app)}
                    >
                      Vedi dettagli
                    </button>
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

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={`Candidatura di ${active?.minecraftName ?? ""}`}
      >
        {active && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="venrix-label">Discord</p>
                <p className="text-slate-300">{active.discord}</p>
              </div>
              <div>
                <p className="venrix-label">Età</p>
                <p className="text-slate-300">{active.age}</p>
              </div>
            </div>
            <div>
              <p className="venrix-label">Ruolo desiderato</p>
              <p className="text-slate-300">{active.roles}</p>
            </div>
            {active.answers && active.answers.length > 0 ? (
              <div className="space-y-4">
                {groupBySection(active.answers).map((group) => (
                  <div key={group.section}>
                    <p className="font-display text-[10px] uppercase tracking-wide text-venrix-400">
                      {group.section}
                    </p>
                    <div className="mt-2 space-y-3">
                      {group.items.map((item) => (
                        <div key={item.question}>
                          <p className="text-xs text-slate-500">{item.question}</p>
                          <p className="mt-1 rounded-lg bg-ink-800 p-3 text-slate-300">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div>
                  <p className="venrix-label">Esperienza</p>
                  <p className="rounded-lg bg-ink-800 p-3 text-slate-300">{active.experience}</p>
                </div>
                <div>
                  <p className="venrix-label">Motivazione</p>
                  <p className="rounded-lg bg-ink-800 p-3 text-slate-300">{active.message}</p>
                </div>
              </>
            )}
            {liteBans?.configured && (
              <div>
                <p className="venrix-label">Storico sanzioni (LiteBans)</p>
                {liteBans.records.length === 0 ? (
                  <p className="text-xs text-slate-500">Nessuna sanzione trovata.</p>
                ) : (
                  <ul className="space-y-1 rounded-lg bg-ink-800 p-3 text-xs text-slate-300">
                    {liteBans.records.map((r) => (
                      <li key={`${r.type}-${r.id}`}>
                        <span className="font-semibold uppercase text-venrix-300">
                          #{r.id} · {r.type}
                        </span>{" "}
                        — {r.reason ?? "Nessun motivo indicato"} (staff: {r.staff ?? "—"})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div>
              <label className="venrix-label" htmlFor="applyDiscordId">
                Discord ID (opzionale)
              </label>
              <input
                id="applyDiscordId"
                className="venrix-input font-mono text-xs"
                placeholder={`Lascia vuoto: lo cerchiamo da "${active.discord}"`}
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value.trim())}
              />
              <p className="mt-1 text-xs text-slate-500">
                Serve solo se il DM non parte perché l'username non viene trovato nel server:
                tasto destro sull'utente in Discord → “Copia ID utente”.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => updateStatus(active.id, "APPROVED")}>
                Approva
              </Button>
              <Button variant="danger" onClick={() => updateStatus(active.id, "REJECTED")}>
                Rifiuta
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
