"use client";

import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/icons";
import { renderRulesBody, type RulesFormat } from "@/lib/rulesFormat";

const MODES: { value: RulesFormat; label: string; hint: string }[] = [
  {
    value: "text",
    label: "Testo",
    hint: "Scrivi normalmente: riga vuota = nuovo paragrafo, a capo = va a capo. Niente codice.",
  },
  {
    value: "markdown",
    label: "Markdown",
    hint: "# Titolo, ## Sottotitolo, **grassetto**, *corsivo*, - elenco, [testo](https://link)",
  },
  {
    value: "html",
    label: "HTML",
    hint: "HTML grezzo come prima: <h2>, <p>, <ul><li>, <a href>... (viene pulito in automatico)",
  },
];

export function RulesEditor({
  initialContent,
  initialFormat,
}: {
  initialContent: string;
  initialFormat: RulesFormat;
}) {
  const [content, setContent] = useState(initialContent);
  const [format, setFormat] = useState<RulesFormat>(initialFormat);
  const [preview, setPreview] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anteprima live: stessa conversione della pagina pubblica + pulizia.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const html = await renderRulesBody(format, content);
        if (!cancelled) setPreview(DOMPurify.sanitize(html));
      } catch {
        if (!cancelled) setPreview("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [format, content]);

  async function save() {
    setError(null);
    setSaved(false);
    const res = await fetch("/api/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, format }),
    });
    if (!res.ok) {
      setError("Errore durante il salvataggio");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const activeHint = MODES.find((m) => m.value === format)?.hint ?? "";

  return (
    <div className="space-y-4">
      <div className="venrix-card space-y-4 p-6">
        <div>
          <span className="venrix-label">Formato di scrittura</span>
          <div className="mt-1.5 flex flex-wrap gap-2" role="tablist" aria-label="Formato regolamento">
            {MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                role="tab"
                aria-selected={format === mode.value}
                onClick={() => setFormat(mode.value)}
                className={`rounded-sm border px-4 py-2 text-sm font-medium transition ${
                  format === mode.value
                    ? "border-venrix-500/50 bg-venrix-600 text-onbrand"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-venrix-500/40 hover:text-venrix-200"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{activeHint}</p>
          <p className="mt-1 text-xs text-slate-500">
            Cambiare formato non converte il testo già scritto: ricontrolla l&apos;anteprima
            qui sotto prima di salvare.
          </p>
        </div>

        <div>
          <label className="venrix-label" htmlFor="rules-content">
            Contenuto del regolamento
          </label>
          <textarea
            id="rules-content"
            className="venrix-input resize-none font-mono text-xs"
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={save}>Salva regolamento</Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <IconCheck className="h-3.5 w-3.5" /> Salvato
            </span>
          )}
          {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
        </div>
      </div>

      <div className="venrix-card p-6">
        <p className="venrix-label">Anteprima (come la vedono i giocatori)</p>
        <div
          className="prose mt-3 max-w-none prose-headings:font-display prose-a:text-venrix-300"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>
    </div>
  );
}
