"use client";

import { useEffect, useState, useCallback } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { NotifyNotice, noticeFromOutcome, type Notice } from "@/components/dashboard/NotifyNotice";

/**
 * Le due fasi di una candidatura: PENDING/APPROVED/REJECTED decidono la
 * scritta, INTERVIEW_* l'orale. APPROVED vuol dire "scritta passata, orale
 * da fare": e' lo stato su cui lo staff torna dopo il colloquio.
 * WITHDRAWN e' fuori dalle fasi: il candidato si e' ritirato, e si puo'
 * annullare cosi sia una scritta che un orale.
 */
type ApplyStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "INTERVIEW_PASSED"
  | "INTERVIEW_REJECTED"
  | "WITHDRAWN";

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
  status: ApplyStatus;
  createdAt: string;
  userId: string | null;
  user: { username: string } | null;
  reviewedBy: { username: string } | null;
};

/**
 * Data e ora dell'invio. L'ora serve per i doppioni: due candidature dello
 * stesso giocatore spesso arrivano lo stesso giorno a pochi minuti l'una
 * dall'altra, e senza l'ora non si capisce quale tenere.
 */
function sentOn(value: string) {
  const d = new Date(value);
  return {
    date: d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
  };
}

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

  async function updateStatus(id: string, newStatus: ApplyStatus) {
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

  async function removeCooldown(app: Application) {
    const res = await fetch(`/api/staff-apply/${app.id}/unlock`, { method: "POST" });
    const data = await res.json().catch(() => null);
    setNotice(
      res.ok
        ? { tone: "ok", text: `${app.minecraftName} può inviare subito una nuova candidatura.` }
        : { tone: "warn", text: data?.error ?? "Impossibile rimuovere la limitazione." }
    );
    setActive(null);
  }

  /**
   * Doppioni: quando la stessa candidatura e' arrivata due volte si tiene
   * quella buona e si cancella l'altra. E' definitivo, quindi si conferma.
   */
  async function removeApplication(app: Application) {
    const sent = sentOn(app.createdAt);
    if (
      !confirm(
        `Eliminare definitivamente la candidatura di ${app.minecraftName} (${app.roles}) inviata il ${sent.date} alle ${sent.time}?`
      )
    )
      return;

    const res = await fetch(`/api/staff-apply/${app.id}`, { method: "DELETE" });
    const data = res.ok ? null : await res.json().catch(() => null);
    setNotice(
      res.ok
        ? { tone: "ok", text: `Candidatura di ${app.minecraftName} eliminata.` }
        : { tone: "warn", text: data?.error ?? "Impossibile eliminare la candidatura." }
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
            <option value="APPROVED">In attesa orale</option>
            <option value="REJECTED">Respinte alla scritta</option>
            <option value="INTERVIEW_PASSED">Orale superata</option>
            <option value="INTERVIEW_REJECTED">Respinte all&apos;orale</option>
            <option value="WITHDRAWN">Annullate</option>
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
              <th className="px-4 py-3">Inviata</th>
              <th className="px-4 py-3 text-right">Azioni</th>
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
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                    {sentOn(app.createdAt).date}
                    <span className="ml-2 text-xs text-slate-500">
                      {sentOn(app.createdAt).time}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-sm font-semibold text-venrix-300 hover:underline"
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
                p === page ? "bg-venrix-600 text-onbrand" : "text-slate-300 hover:bg-white/10"
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="venrix-label">Ruolo desiderato</p>
                <p className="text-slate-300">{active.roles}</p>
              </div>
              <div>
                <p className="venrix-label">Inviata il</p>
                <p className="text-slate-300">
                  {sentOn(active.createdAt).date} alle {sentOn(active.createdAt).time}
                </p>
              </div>
            </div>
            {active.answers && active.answers.length > 0 ? (
              <div className="space-y-4">
                {groupBySection(active.answers).map((group) => (
                  <div key={group.section}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-venrix-200">
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
                        {r.reason ?? "Nessun motivo indicato"} (staff: {r.staff ?? "-"})
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

            {/*
              Una fase per volta: finche' la scritta e' in attesa si decide
              solo quella, e l'esito dell'orale compare dopo — cosi non si
              chiude un colloquio che non e' ancora stato fissato.
            */}
            <div className="border-t border-white/10 pt-4">
              <p className="venrix-label">
                {active.status === "WITHDRAWN"
                  ? "Candidatura annullata"
                  : active.status === "PENDING" || active.status === "REJECTED"
                    ? "Candidatura scritta"
                    : "Candidatura orale"}
              </p>
              <div className="mb-3 flex items-center gap-2">
                <StatusBadge status={active.status} />
              </div>

              {active.status === "WITHDRAWN" ? (
                <>
                  <p className="mb-3 text-xs text-slate-500">
                    Il candidato si è ritirato, quindi la candidatura è chiusa senza un esito.
                    Puoi riaprirla se ha cambiato idea di nuovo.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => updateStatus(active.id, "PENDING")}>
                      Riapri la scritta
                    </Button>
                    <Button variant="secondary" onClick={() => updateStatus(active.id, "APPROVED")}>
                      Riapri l&apos;orale
                    </Button>
                  </div>
                </>
              ) : active.status === "PENDING" ? (
                <>
                  <p className="mb-3 text-xs text-slate-500">
                    Approvando la scritta il candidato passa in attesa della candidatura orale e
                    riceve su Discord l&apos;invito ad aprire un ticket.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => updateStatus(active.id, "APPROVED")}>
                      Approva la scritta
                    </Button>
                    <Button variant="danger" onClick={() => updateStatus(active.id, "REJECTED")}>
                      Rifiuta
                    </Button>
                    <Button variant="secondary" onClick={() => updateStatus(active.id, "WITHDRAWN")}>
                      Annulla candidatura
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    “Annulla candidatura” è per chi si è ritirato: la chiude in nero, senza
                    rifiutarla e senza mandargli un DM.
                  </p>
                </>
              ) : active.status === "REJECTED" ? (
                <>
                  <p className="mb-3 text-xs text-slate-500">
                    La candidatura scritta è stata respinta. Puoi riaprirla se è stato un errore.
                  </p>
                  <Button variant="secondary" onClick={() => updateStatus(active.id, "PENDING")}>
                    Rimetti in attesa
                  </Button>
                </>
              ) : (
                <>
                  <p className="mb-3 text-xs text-slate-500">
                    Registra com&apos;è andato il colloquio: il candidato riceve l&apos;esito su
                    Discord.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() => updateStatus(active.id, "INTERVIEW_PASSED")}
                    >
                      Orale superata
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => updateStatus(active.id, "INTERVIEW_REJECTED")}
                    >
                      Orale rifiutata
                    </Button>
                    {active.status === "APPROVED" ? (
                      <Button variant="secondary" onClick={() => updateStatus(active.id, "WITHDRAWN")}>
                        Annulla candidatura
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={() => updateStatus(active.id, "APPROVED")}>
                        Rimetti in attesa orale
                      </Button>
                    )}
                  </div>
                  {active.status === "APPROVED" && (
                    <p className="mt-2 text-xs text-slate-500">
                      Se si è ritirato prima del colloquio usa “Annulla candidatura”: la chiude in
                      nero, senza contarla come orale rifiutata.
                    </p>
                  )}
                </>
              )}
            </div>

            {active.userId && (
              <div className="border-t border-white/10 pt-4">
                <p className="venrix-label">Limite di 14 giorni</p>
                <p className="mb-3 text-xs text-slate-500">
                  Account: <span className="text-slate-300">{active.user?.username ?? "-"}</span>.
                  Rimuovendo la limitazione il candidato può inviare subito una nuova candidatura,
                  per qualsiasi posizione.
                </p>
                <Button variant="secondary" onClick={() => removeCooldown(active)}>
                  Rimuovi limitazione
                </Button>
              </div>
            )}

            <div className="border-t border-white/10 pt-4">
              <p className="venrix-label">Elimina candidatura</p>
              <p className="mb-3 text-xs text-slate-500">
                Serve per i doppioni: se la stessa candidatura è arrivata due volte, tieni quella
                giusta ed elimina l&apos;altra. È definitivo e non si può annullare, il candidato
                non riceve nessun messaggio. Per chiudere una candidatura vera usa “Rifiuta” o
                “Annulla candidatura”.
              </p>
              <Button variant="danger" onClick={() => removeApplication(active)}>
                Elimina definitivamente
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
