"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconCheck, PixelFrame } from "@/components/icons";

export function AppealForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      minecraftName: form.get("minecraftName"),
      uuid: form.get("uuid"),
      banId: form.get("banId"),
      banReason: form.get("banReason"),
      message: form.get("message"),
    };

    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Si è verificato un errore, riprova più tardi.");
        setStatus("error");
        return;
      }

      setStatus("success");
      e.currentTarget.reset();
    } catch {
      setError("Impossibile contattare il server, riprova più tardi.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="venrix-card flex flex-col items-center gap-3 p-8 text-center">
        <PixelFrame className="h-12 w-12 text-emerald-400">
          <IconCheck className="h-6 w-6" />
        </PixelFrame>
        <p className="font-display text-xs text-emerald-400">Richiesta inviata</p>
        <p className="text-sm text-slate-400">
          Il nostro staff esaminerà il tuo appeal il prima possibile.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="venrix-card space-y-4 p-6">
      <div>
        <label className="venrix-label" htmlFor="minecraftName">
          Nome Minecraft *
        </label>
        <input
          id="minecraftName"
          name="minecraftName"
          required
          minLength={3}
          maxLength={16}
          className="venrix-input"
          placeholder="Steve"
        />
      </div>

      <div>
        <label className="venrix-label" htmlFor="uuid">
          UUID (opzionale)
        </label>
        <input id="uuid" name="uuid" className="venrix-input" placeholder="xxxxxxxx-xxxx-..." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="venrix-label" htmlFor="banId">
            Ban ID (se lo conosci)
          </label>
          <input
            id="banId"
            name="banId"
            type="text"
            maxLength={20}
            className="venrix-input"
            placeholder="Es. F06494"
          />
        </div>
        <div>
          <label className="venrix-label" htmlFor="banReason">
            Motivo del ban (se noto)
          </label>
          <input id="banReason" name="banReason" className="venrix-input" placeholder="Es. Cheating" />
        </div>
      </div>
      <p className="-mt-2 text-xs text-slate-500">
        Il Ban ID è visibile nel messaggio di ban in gioco o su Discord (es. "F06494") e aiuta
        lo staff a trovare subito la sanzione corretta.
      </p>

      <div>
        <label className="venrix-label" htmlFor="message">
          Spiega la tua situazione *
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={20}
          maxLength={3000}
          rows={6}
          className="venrix-input resize-none"
          placeholder="Racconta cosa è successo e perché pensi che il ban debba essere rimosso..."
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={status === "loading"} className="w-full">
        {status === "loading" ? "Invio in corso..." : "Invia richiesta"}
      </Button>
    </form>
  );
}
