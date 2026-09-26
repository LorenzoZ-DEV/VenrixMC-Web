"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/icons";
import type { Announcement, AnnouncementKind, ServerMode, StatusOverride } from "@/lib/siteStatus";

type Message = { tone: "ok" | "error"; text: string } | null;

async function saveSetting(key: string, value: unknown): Promise<string | null> {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value: JSON.stringify(value) }),
  });
  if (res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.error ?? "Salvataggio fallito.";
}

/**
 * Gestione annunci e stato modalità: la barra sopra la navbar e la pagina
 * /status leggono queste due righe di impostazioni.
 */
export function StatusPanel({
  initialAnnouncement,
  initialModes,
}: {
  initialAnnouncement: Announcement;
  initialModes: ServerMode[];
}) {
  const [announcement, setAnnouncement] = useState<Announcement>(initialAnnouncement);
  const [modes, setModes] = useState<ServerMode[]>(initialModes);
  const [message, setMessage] = useState<Message>(null);
  const [saving, setSaving] = useState(false);

  async function saveAnnouncement() {
    setSaving(true);
    const err = await saveSetting("site_announcement", announcement);
    setMessage(
      err ? { tone: "error", text: err } : { tone: "ok", text: "Annuncio salvato: la barra è già live." }
    );
    setSaving(false);
  }

  async function saveModes() {
    setSaving(true);
    /*
     * Ogni campo va ricopiato: quello che non finisce qui viene perso al
     * salvataggio. Prima mancavano `statusOverride` e `proxy`, quindi
     * salvare le modalita' azzerava in silenzio tutti gli override manuali
     * appena impostati nella riga sopra.
     */
    const cleaned = modes.map((m) => ({
      slug: m.slug.trim().toLowerCase(),
      name: m.name.trim(),
      host: m.host.trim(),
      port: Number(m.port),
      statusOverride: m.statusOverride ?? "auto",
      proxy: m.proxy ?? m.slug.trim().toLowerCase() === "network",
    }));
    const err = await saveSetting("server_modes", cleaned);
    if (!err) setModes(cleaned);
    setMessage(
      err ? { tone: "error", text: err } : { tone: "ok", text: "Modalità salvate: /status è già aggiornata." }
    );
    setSaving(false);
  }

  function patchMode(index: number, update: Partial<ServerMode>) {
    setModes((list) => list.map((m, i) => (i === index ? { ...m, ...update } : m)));
    setMessage(null);
  }

  return (
    <section className="venrix-card space-y-6 p-6">
      <div>
        <h2 className="font-display text-base font-semibold text-white">Annuncio di stato</h2>
        <p className="mt-1 text-sm text-slate-400">
          Quando attivo, appare una barra colorata sopra la navbar su tutte le pagine,
          usala per manutenzioni programmate o incidenti tecnici.
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          className="mt-1"
          checked={announcement.enabled}
          onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
        />
        <span>Mostra la barra d&apos;annuncio sul sito</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <div>
          <label className="venrix-label" htmlFor="announce-kind">Tipo</label>
          <select
            id="announce-kind"
            className="venrix-input"
            value={announcement.kind}
            onChange={(e) =>
              setAnnouncement({ ...announcement, kind: e.target.value as AnnouncementKind })
            }
          >
            <option value="maintenance">Manutenzione</option>
            <option value="incident">Incidente tecnico</option>
            <option value="info">Avviso generico</option>
          </select>
        </div>
        <div>
          <label className="venrix-label" htmlFor="announce-message">Messaggio</label>
          <input
            id="announce-message"
            className="venrix-input"
            maxLength={500}
            placeholder="Es. Riavvio lobby alle 15:00, 5 minuti di downtime"
            value={announcement.message}
            onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Button type="button" variant="secondary" disabled={saving} onClick={saveAnnouncement}>
          Salva annuncio
        </Button>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h2 className="font-display text-base font-semibold text-white">Modalità del network</h2>
        <p className="mt-1 text-sm text-slate-400">
          La pagina /status interroga ogni modalità in diretta, a meno che tu non forzi
          lo stato a mano (utile in manutenzione: la modalità risulta “Manutenzione”
          anche se il server risponde ancora al ping).
        </p>
      </div>

      <div className="space-y-3">
        {modes.map((mode, i) => (
          <div key={`${mode.slug}-${i}`} className="grid gap-2 rounded-lg border border-white/10 p-3 sm:grid-cols-[1fr_1fr_2fr_90px_130px_auto_auto]">
            <input
              className="venrix-input font-mono text-xs"
              title="Slug (minuscole, numeri, trattini)"
              value={mode.slug}
              onChange={(e) => patchMode(i, { slug: e.target.value })}
            />
            <input
              className="venrix-input text-sm"
              title="Nome mostrato"
              value={mode.name}
              onChange={(e) => patchMode(i, { name: e.target.value })}
            />
            <input
              className="venrix-input font-mono text-xs"
              title="Host"
              value={mode.host}
              onChange={(e) => patchMode(i, { host: e.target.value })}
            />
            <input
              className="venrix-input font-mono text-xs"
              title="Porta"
              inputMode="numeric"
              value={mode.port}
              onChange={(e) => patchMode(i, { port: Number(e.target.value) || 0 })}
            />
            <select
              className="venrix-input text-xs"
              title="Stato: Automatico segue il ping live"
              value={mode.statusOverride ?? "auto"}
              onChange={(e) => patchMode(i, { statusOverride: e.target.value as StatusOverride })}
            >
              <option value="auto">Auto (live)</option>
              <option value="online">Forza online</option>
              <option value="maintenance">Manutenzione</option>
              <option value="offline">Forza offline</option>
            </select>
            {/*
              Il proxy e' l'ingresso da cui passano tutti: il suo conteggio
              e' gia' il totale del network. Marcandolo qui, /status smette
              di sommarlo ai backend (che sono gli stessi giocatori).
            */}
            <label
              className="flex cursor-pointer items-center gap-2 px-1 text-xs text-slate-400"
              title="Il proxy riporta gia tutti i giocatori del network: non va sommato ai backend"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-venrix-500"
                checked={mode.proxy ?? mode.slug === "network"}
                onChange={(e) => patchMode(i, { proxy: e.target.checked })}
              />
              Proxy
            </label>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setModes((list) => list.filter((_, j) => j !== i))}
            >
              Rimuovi
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setModes((list) => [
              ...list,
              { slug: "nuova", name: "Nuova", host: "178.218.144.74", port: 25565, proxy: false },
            ])
          }
        >
          Aggiungi modalità
        </Button>
        <Button type="button" variant="secondary" disabled={saving} onClick={saveModes}>
          Salva modalità
        </Button>
      </div>

      {message && (
        <p
          className={`flex items-center gap-1.5 text-sm ${
            message.tone === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.tone === "ok" && <IconCheck className="h-3.5 w-3.5" />}
          {message.text}
        </p>
      )}
    </section>
  );
}
