"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLogout } from "@/components/icons";

/** Esce dal forum. Usa la stessa rotta di logout della dashboard. */
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/forum");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="pixel-corners-sm inline-flex shrink-0 items-center gap-1.5 border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
    >
      <IconLogout className="h-4 w-4" />
      {busy ? "Uscita…" : "Esci"}
    </button>
  );
}
