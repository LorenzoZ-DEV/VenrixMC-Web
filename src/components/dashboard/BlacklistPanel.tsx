"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconSearch, IconShield, IconTrash, PixelFrame } from "@/components/icons";

type Entry = {
  id: string;
  minecraftUuid: string | null;
  minecraftName: string | null;
  discordId: string | null;
  reason: string;
  createdAt: string;
  createdBy: { username: string } | null;
};

const EMPTY_FORM = { minecraftUuid: "", minecraftName: "", discordId: "", reason: "" };

export function BlacklistPanel() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (q: string) => {
    const res = await fetch(`/api/staff-blacklist${q ? `?q=${encodeURIComponent(q)}` : ""}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      setEntries([]);
      return;
    }
    const data = await res.json();
    setEntries(data.entries ?? []);
  }, []);

  useEffect(() => {
    // Ricerca ritardata: la lista e' piccola, ma senza attesa si parte una
    // richiesta per ogni tasto premuto.
    const timer = setTimeout(() => void load(query), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/staff-blacklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Non è stato possibile salvare la voce.");
      return;
    }
    setForm(EMPTY_FORM);
    await load(query);
  }

  async function remove(entry: Entry) {
    const who = entry.minecraftName ?? entry.minecraftUuid ?? entry.discordId ?? "questa voce";
    if (!confirm(`Togliere ${who} dalla blacklist? Potrà candidarsi di nuovo.`)) return;
    await fetch(`/api/staff-blacklist/${entry.id}`, { method: "DELETE" });
    await load(query);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="venrix-card space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="bl-name" className="venrix-label">
              Nick Minecraft
            </label>
            <input
              id="bl-name"
              className="venrix-input"
              placeholder="Steve"
              value={form.minecraftName}
              onChange={(e) => setForm({ ...form, minecraftName: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="bl-uuid" className="venrix-label">
              UUID Minecraft
            </label>
            <input
              id="bl-uuid"
              className="venrix-input font-mono"
              placeholder="con o senza trattini"
              value={form.minecraftUuid}
              onChange={(e) => setForm({ ...form, minecraftUuid: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="bl-discord" className="venrix-label">
              ID Discord
            </label>
            <input
              id="bl-discord"
              className="venrix-input font-mono"
              placeholder="17-20 cifre"
              value={form.discordId}
              onChange={(e) => setForm({ ...form, discordId: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="bl-reason" className="venrix-label">
            Motivo
          </label>
          <textarea
            id="bl-reason"
            className="venrix-input min-h-[80px] resize-y"
            placeholder="Viene mostrato alla persona quando prova a candidarsi."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
          <p className="mt-2 text-[13px] text-slate-500">
            Basta uno dei tre dati. L&apos;UUID è quello che resiste ai cambi di nick, quindi
            quando ce l&apos;hai è il più affidabile.
          </p>
        </div>

        {/* Errore inline sotto il modulo, non in un alert di sistema. */}
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? "Salvataggio..." : "Aggiungi alla blacklist"}
        </Button>
      </form>

      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="venrix-input pl-10"
          placeholder="Cerca per nick, UUID o ID Discord"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cerca nella blacklist"
        />
      </div>

      {entries === null ? (
        /* Scheletro della stessa forma delle righe vere: la lista non
           sobbalza quando i dati arrivano. */
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="venrix-card h-[86px] animate-pulse opacity-60" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="venrix-card flex flex-col items-center gap-3 p-10 text-center">
          <PixelFrame className="h-12 w-12 text-venrix-300">
            <IconShield className="h-6 w-6" />
          </PixelFrame>
          <p className="font-display text-base font-semibold text-white">
            {query ? "Nessuna corrispondenza" : "Blacklist vuota"}
          </p>
          <p className="max-w-sm text-sm text-slate-400">
            {query
              ? "Nessuna voce contiene questo dato."
              : "Chi finisce qui non può più inviare candidature staff, e vede il motivo che scrivi."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="venrix-card flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {entry.minecraftName && (
                    <span className="font-display text-base font-bold text-white">
                      {entry.minecraftName}
                    </span>
                  )}
                  {entry.minecraftUuid && (
                    <span className="mono-label rounded-full bg-white/8 px-2.5 py-1 text-slate-400">
                      UUID {entry.minecraftUuid.slice(0, 8)}
                    </span>
                  )}
                  {entry.discordId && (
                    <span className="mono-label rounded-full bg-white/8 px-2.5 py-1 text-slate-400">
                      Discord {entry.discordId}
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{entry.reason}</p>
                <p className="mt-2 text-[13px] text-slate-500">
                  Aggiunto da {entry.createdBy?.username ?? "account rimosso"} il{" "}
                  {new Date(entry.createdAt).toLocaleDateString("it-IT")}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => remove(entry)}
                aria-label={`Rimuovi ${entry.minecraftName ?? "la voce"} dalla blacklist`}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
