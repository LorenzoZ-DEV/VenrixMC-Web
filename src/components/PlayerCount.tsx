"use client";

import { useEffect, useState } from "react";

type Status = { online: boolean; players: { online: number; max: number } };

export function PlayerCount({ initial }: { initial: Status }) {
  const [status, setStatus] = useState<Status>(initial);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/players", { cache: "no-store" });
        if (res.ok) setStatus(await res.json());
      } catch {
        // keep last known value on transient network errors
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="surface-raised inline-flex items-center gap-3 bg-ink-700 px-4 py-2.5 text-sm"
      role="status"
      aria-live="polite"
    >
      {/*
        Il led di stato e' un quadrato, non un pallino: e' l'unico verde del
        sito e sta qui perche' e' un dato reale (il server risponde o no),
        non una decorazione. Il quadrato dietro pulsa in loop, quello davanti
        resta fermo: un punto che lampeggia da solo legge come un errore.
      */}
      <span className="relative flex h-3 w-3 shrink-0">
        {status.online && (
          <span className="absolute inline-flex h-full w-full animate-ping bg-emerald-400 opacity-60" />
        )}
        <span
          className={`relative inline-flex h-3 w-3 ${
            status.online ? "bg-emerald-400" : "bg-red-500"
          }`}
          style={{ boxShadow: "inset -1px -1px 0 rgb(0 0 0 / 0.35)" }}
        />
      </span>
      <span className="mono-label text-slate-300">
        {status.online ? (
          <>
            {/* tabular: il conteggio cambia ogni 30s e senza cifre a
                larghezza fissa la riga "salta" a ogni aggiornamento. */}
            <strong className="tabular text-[13px] font-bold text-white">
              {status.players.online}
            </strong>
            {status.players.max ? (
              <span className="tabular text-slate-500">/{status.players.max}</span>
            ) : null}{" "}
            online
          </>
        ) : (
          "Server offline"
        )}
      </span>
    </div>
  );
}
