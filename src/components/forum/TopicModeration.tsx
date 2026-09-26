"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconShield, IconTrash } from "@/components/icons";

/**
 * Barra di moderazione in testa a una discussione: fissa in alto, chiudi,
 * sposta, elimina. Compare solo allo staff — la pagina non la renderizza
 * nemmeno agli altri, e le rotte ricontrollano comunque i permessi.
 */
export function TopicModeration({
  topicId,
  pinned,
  locked,
  boardId,
  boards,
}: {
  topicId: string;
  pinned: boolean;
  locked: boolean;
  boardId: string;
  boards: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/forum/topics/${topicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Operazione non riuscita.");
        return;
      }
      // Uno spostamento cambia l'URL della discussione, quindi si naviga
      // invece di ricaricare una rotta che non esiste piu.
      if (payload.topic?.url) router.replace(payload.topic.url);
      router.refresh();
    } catch {
      setError("Impossibile contattare il server.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Eliminare la discussione con tutti i suoi messaggi?")) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/forum/topics/${topicId}`, { method: "DELETE" });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Operazione non riuscita.");
        return;
      }
      router.push(payload.board);
      router.refresh();
    } catch {
      setError("Impossibile contattare il server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pixel-corners flex flex-wrap items-center gap-2 border border-venrix-500/25 bg-venrix-600/[0.07] px-4 py-2.5">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-venrix-300">
        <IconShield className="h-3.5 w-3.5" /> Staff
      </span>

      <button
        type="button"
        disabled={busy}
        onClick={() => patch({ pinned: !pinned })}
        className="pixel-corners-sm border border-white/10 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
      >
        {pinned ? "Togli dai fissati" : "Fissa in alto"}
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={() => patch({ locked: !locked })}
        className="pixel-corners-sm border border-white/10 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
      >
        {locked ? "Riapri" : "Chiudi"}
      </button>

      {boards.length > 1 && (
        <select
          value={boardId}
          disabled={busy}
          onChange={(e) => patch({ boardId: e.target.value })}
          className="pixel-corners-sm border border-white/10 bg-ink-700 px-2 py-1 text-xs text-slate-300"
          aria-label="Sposta in un altro forum"
        >
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={remove}
        className="pixel-corners-sm ml-auto inline-flex items-center gap-1 border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
      >
        <IconTrash className="h-3 w-3" /> Elimina
      </button>

      {error && <span className="w-full text-xs text-red-400">{error}</span>}
    </div>
  );
}
