"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { MarkdownEditor } from "./MarkdownEditor";
import { tagColor } from "@/lib/forumMeta";

type Tag = { id: string; name: string; slug: string; color: string; staffOnly?: boolean };

const MAX_TAGS = 5;

export function NewTopicForm({
  boardId,
  boardName,
  tags,
}: {
  boardId: string;
  boardName: string;
  tags: Tag[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((t) => t !== id)
        : current.length >= MAX_TAGS
          ? current
          : [...current, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, title, content, tagIds: selected }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossibile aprire la discussione.");
        return;
      }

      router.push(data.topic.url);
      router.refresh();
    } catch {
      setError("Impossibile contattare il server, riprova più tardi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="venrix-card space-y-5 p-6">
      <div>
        <label className="venrix-label" htmlFor="title">
          Titolo
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          required
          placeholder={`Di cosa vuoi parlare in ${boardName}?`}
          className="venrix-input"
        />
      </div>

      {tags.length > 0 && (
        <div>
          <label className="venrix-label">
            Etichette <span className="normal-case tracking-normal">(max {MAX_TAGS})</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const style = tagColor(tag.color);
              const on = selected.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
                    on ? style.className : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                  )}
                >
                  <span className={clsx("h-1.5 w-1.5 rounded-sm", on ? style.dot : "bg-slate-600")} />
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="venrix-label">Messaggio</label>
        <MarkdownEditor value={content} onChange={setContent} rows={10} disabled={sending} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          disabled={sending}
        >
          Annulla
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={sending || title.trim().length < 5 || content.trim().length < 10}
        >
          {sending ? "Pubblicazione…" : "Pubblica discussione"}
        </Button>
      </div>
    </form>
  );
}
