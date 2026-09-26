"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { IconEdit, IconSearch } from "@/components/icons";

type Tool = {
  label: string;
  title: string;
  before: string;
  after: string;
  /** Prefisso di riga (citazioni, elenchi, titoli) invece che avvolgente. */
  block?: boolean;
  /** Testo inserito cosi com'e, ignorando la selezione (tabelle, blocchi). */
  snippet?: string;
};

const TABLE_SNIPPET = `
| Colonna | Colonna |
| --- | --- |
| valore | valore |
`;

const TOOLS: Tool[] = [
  { label: "B", title: "Grassetto", before: "**", after: "**" },
  { label: "I", title: "Corsivo", before: "_", after: "_" },
  { label: "S", title: "Barrato", before: "~~", after: "~~" },
  { label: "H", title: "Titolo", before: "## ", after: "", block: true },
  { label: "</>", title: "Codice", before: "`", after: "`" },
  { label: "{ }", title: "Blocco di codice", before: "", after: "", snippet: "\n```\ncodice\n```\n" },
  { label: "❝", title: "Citazione", before: "> ", after: "", block: true },
  { label: "•", title: "Elenco", before: "- ", after: "", block: true },
  { label: "1.", title: "Elenco numerato", before: "1. ", after: "", block: true },
  { label: "🔗", title: "Link", before: "[", after: "](https://)" },
  { label: "🖼", title: "Immagine", before: "![", after: "](https://)" },
  { label: "▦", title: "Tabella", before: "", after: "", snippet: TABLE_SNIPPET },
  { label: "-", title: "Linea separatrice", before: "", after: "", snippet: "\n---\n" },
];

/**
 * Campo di scrittura dei messaggi: Markdown con una barra di scorciatoie e
 * un'anteprima. L'anteprima la rende il server (/api/forum/preview) con lo
 * stesso codice che rende il messaggio pubblicato, cosi non puo mostrare
 * qualcosa di diverso da quello che verra salvato.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Scrivi il tuo messaggio…",
  rows = 8,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  function wrap(tool: Tool) {
    const el = textarea.current;
    if (!el) return;

    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end);

    let next: string;
    if (tool.snippet) {
      // Strutture su piu righe: si inseriscono intere al punto del cursore,
      // avvolgere una selezione non avrebbe senso.
      next = `${value.slice(0, start)}${tool.snippet}${value.slice(end)}`;
    } else if (tool.block) {
      // Prefisso di riga: va messo davanti a ogni riga selezionata, non
      // solo davanti al blocco.
      next = `${value.slice(0, start)}${(selected || "testo")
        .split("\n")
        .map((line) => tool.before + line)
        .join("\n")}${value.slice(end)}`;
    } else {
      next = `${value.slice(0, start)}${tool.before}${selected || "testo"}${tool.after}${value.slice(end)}`;
    }

    onChange(next);
    requestAnimationFrame(() => el.focus());
  }

  async function showPreview() {
    setTab("preview");
    setLoading(true);
    try {
      const res = await fetch("/api/forum/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      });
      const data = await res.json();
      setPreview(res.ok ? data.html : "<p>Anteprima non disponibile.</p>");
    } catch {
      setPreview("<p>Anteprima non disponibile.</p>");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pixel-corners overflow-hidden border border-white/10 bg-ink-700">
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-ink-600/50 px-2 py-1.5">
        {TOOLS.map((tool) => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            disabled={disabled || tab === "preview"}
            onClick={() => wrap(tool)}
            className="pixel-corners-sm h-7 min-w-[28px] px-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            {tool.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={clsx(
              "pixel-corners-sm inline-flex h-7 items-center gap-1.5 px-2.5 text-xs font-semibold transition",
              tab === "write" ? "bg-venrix-600/20 text-venrix-200" : "text-slate-400 hover:bg-white/5"
            )}
          >
            <IconEdit className="h-3 w-3" /> Scrivi
          </button>
          <button
            type="button"
            onClick={showPreview}
            className={clsx(
              "pixel-corners-sm inline-flex h-7 items-center gap-1.5 px-2.5 text-xs font-semibold transition",
              tab === "preview"
                ? "bg-venrix-600/20 text-venrix-200"
                : "text-slate-400 hover:bg-white/5"
            )}
          >
            <IconSearch className="h-3 w-3" /> Anteprima
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="w-full resize-y bg-transparent px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
      ) : (
        <div
          className="forum-content prose prose-sm min-h-[8rem] max-w-none px-4 py-3 prose-a:text-venrix-300"
          dangerouslySetInnerHTML={{
            __html: loading ? "<p>Caricamento…</p>" : preview || "<p>Niente da mostrare.</p>",
          }}
        />
      )}

      <p className="border-t border-white/10 px-4 py-1.5 text-[11px] text-slate-500">
        Markdown completo: **grassetto**, _corsivo_, `codice`, ## titoli, &gt; citazioni, elenchi,
        tabelle, immagini e link.
      </p>
    </div>
  );
}
