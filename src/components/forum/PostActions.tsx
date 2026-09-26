"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MarkdownEditor } from "./MarkdownEditor";
import { IconEdit, IconTrash } from "@/components/icons";

/**
 * Modifica ed eliminazione di un singolo messaggio.
 *
 * Il messaggio si continua a leggere renderizzato dal server: questo
 * componente mostra solo i pulsanti e, quando serve, sostituisce il corpo con
 * l'editor. Cosi l'HTML dei post resta fuori dal bundle del client.
 */
export function PostActions({
  postId,
  rawContent,
  canEdit,
  canDelete,
}: {
  postId: string;
  rawContent: string;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(rawContent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canEdit && !canDelete) return null;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossibile salvare.");
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

  async function remove() {
    if (!confirm("Eliminare questo messaggio? L'operazione non si può annullare.")) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/forum/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Impossibile eliminare.");
        return;
      }
      router.refresh();
    } catch {
      setError("Impossibile contattare il server.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="mt-3 space-y-3">
        <MarkdownEditor value={content} onChange={setContent} rows={8} disabled={busy} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => {
              setContent(rawContent);
              setEditing(false);
            }}
          >
            Annulla
          </Button>
          <Button type="button" size="sm" disabled={busy} onClick={save}>
            {busy ? "Salvataggio…" : "Salva"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-venrix-300"
        >
          <IconEdit className="h-3 w-3" /> Modifica
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-red-400"
        >
          <IconTrash className="h-3 w-3" /> Elimina
        </button>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
