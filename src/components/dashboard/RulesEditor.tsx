"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/icons";

export function RulesEditor({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setSaved(false);
    const res = await fetch("/api/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      setError("Errore durante il salvataggio");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="venrix-card space-y-4 p-6">
      <label className="venrix-label">Contenuto HTML del regolamento</label>
      <textarea
        className="venrix-input resize-none font-mono text-xs"
        rows={16}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <Button onClick={save}>Salva regolamento</Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
            <IconCheck className="h-3.5 w-3.5" /> Salvato
          </span>
        )}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
