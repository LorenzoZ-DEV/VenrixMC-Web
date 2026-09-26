"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MarkdownEditor } from "./MarkdownEditor";

/**
 * Risposta in coda alla discussione. Dopo l'invio il server dice su quale
 * pagina e finito il messaggio (una risposta puo aprire una pagina nuova),
 * quindi si naviga li invece di limitarsi a un refresh.
 */
export function ReplyForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, content }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossibile inviare la risposta.");
        return;
      }

      setContent("");
      router.push(data.url);
      router.refresh();
    } catch {
      setError("Impossibile contattare il server, riprova più tardi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} id="rispondi" className="venrix-card scroll-mt-24 space-y-3 p-5">
      <h3 className="font-display text-sm font-semibold text-white">Scrivi una risposta</h3>

      <MarkdownEditor value={content} onChange={setContent} rows={6} disabled={sending} />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={sending || content.trim().length < 2}>
          {sending ? "Invio…" : "Rispondi"}
        </Button>
      </div>
    </form>
  );
}
