"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { tagColor } from "@/lib/forumMeta";
import { TagPill, type TagShape } from "@/components/forum/TagPill";

type Tag = TagShape & { staffOnly?: boolean };

const MAX_TAGS = 5;

/**
 * Etichette in testa a una discussione, modificabili sul posto: lo staff le
 * usa come stato (Accettato, Rifiutato, Risolto...), l'autore puo cambiare
 * solo quelle non riservate. La rotta ricontrolla comunque cosa e permesso.
 */
export function TopicTagEditor({
  topicId,
  boardSlug,
  current,
  available,
  moderator,
}: {
  topicId: string;
  boardSlug: string;
  current: TagShape[];
  available: Tag[];
  moderator: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(current.map((t) => t.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chi non e staff non tocca le etichette riservate: restano visibili ma
  // bloccate, e la rotta le conserva al salvataggio.
  const locked = new Set(moderator ? [] : available.filter((t) => t.staffOnly).map((t) => t.id));

  function toggle(id: string) {
    if (locked.has(id)) return;
    setSelected((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : list.length >= MAX_TAGS ? list : [...list, id]
    );
  }

  function cancel() {
    setSelected(current.map((t) => t.id));
    setError(null);
    setEditing(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/forum/topics/${topicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: selected }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Operazione non riuscita.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Impossibile contattare il server.");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <>
        {current.map((tag) => (
          <TagPill key={tag.id} tag={tag} href={`/forum/${boardSlug}?tag=${tag.slug}`} />
        ))}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-sm border border-dashed border-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-venrix-500/40 hover:text-venrix-300"
        >
          {current.length ? "Modifica etichette" : "+ Etichetta"}
        </button>
      </>
    );
  }

  // Le etichette riservate gia applicate vanno mostrate anche a chi non puo
  // sceglierle, altrimenti sembrerebbero sparite durante la modifica.
  const shown = available.filter((t) => !locked.has(t.id) || selected.includes(t.id));

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      {shown.map((tag) => {
        const style = tagColor(tag.color);
        const on = selected.includes(tag.id);
        const fixed = locked.has(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            disabled={busy || fixed}
            onClick={() => toggle(tag.id)}
            title={fixed ? "Etichetta gestita dallo staff" : undefined}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed",
              on ? style.className : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
              fixed && "opacity-70"
            )}
          >
            <span className={clsx("h-1.5 w-1.5 rounded-sm", on ? style.dot : "bg-slate-600")} />
            {tag.name}
          </button>
        );
      })}

      <span className="text-[11px] text-slate-600">max {MAX_TAGS}</span>

      <div className="ml-auto flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={cancel}
          className="pixel-corners-sm border border-white/10 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
        >
          Annulla
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="pixel-corners-sm border border-venrix-500/40 bg-venrix-600/20 px-2.5 py-1 text-xs text-venrix-200 transition hover:bg-venrix-600/30 disabled:opacity-50"
        >
          {busy ? "Salvataggio..." : "Salva"}
        </button>
      </div>

      {error && <span className="w-full text-xs text-red-400">{error}</span>}
    </div>
  );
}
