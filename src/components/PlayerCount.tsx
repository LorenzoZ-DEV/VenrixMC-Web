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
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
      <span
        className={`h-2 w-2 rounded-full ${status.online ? "bg-emerald-400" : "bg-red-500"}`}
      />
      <span className="text-slate-200">
        {status.online ? (
          <>
            <strong className="text-white">{status.players.online}</strong>
            {status.players.max ? ` / ${status.players.max}` : ""} online
          </>
        ) : (
          "Server offline"
        )}
      </span>
    </div>
  );
}
