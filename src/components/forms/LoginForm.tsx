"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { IconUsers } from "@/components/icons";

/**
 * Accesso unico alla dashboard. Gli utenti entrano con Discord (e vedono le
 * loro richieste), lo staff puo farlo con Discord o con le credenziali.
 */
export function LoginForm({ discordConfigured }: { discordConfigured: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next");
  const next = rawNext?.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: form.get("identifier"),
        password: form.get("password"),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Credenziali non valide");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-14">
      <div className="pointer-events-none absolute inset-0 bg-venrix-radial" />

      <div className="venrix-card relative w-full max-w-sm p-8">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"
            alt="VenrixMC"
            width={64}
            height={64}
            className="h-16 w-auto"
          />
          <span className="section-eyebrow mt-5">Area personale</span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="mt-1.5 text-[15px] text-slate-400">
            Segui le tue candidature e i tuoi ban appeal. Lo staff trova qui i pannelli di gestione.
          </p>
        </div>

        {discordConfigured ? (
          <a
            href={`/api/auth/discord/start?mode=login&next=${encodeURIComponent(next)}`}
            className="venrix-btn-primary mt-7 w-full"
          >
            <IconUsers className="h-4 w-4" />
            Accedi con Discord
          </a>
        ) : (
          <p className="mt-7 pixel-corners-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-700 dark:text-amber-300">
            L&apos;accesso con Discord non è ancora configurato.
          </p>
        )}

        {/*
          Gli account creati con Discord non hanno password: se qualcuno ci
          prova da qui riceve solo "credenziali non valide" (la risposta non
          distingue i due casi, per non rivelare quali username esistono),
          per questo il form e dichiaratamente riservato allo staff.
        */}
        <div className="mt-7 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          Accesso staff con credenziali
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="venrix-label" htmlFor="identifier">
              Username o email
            </label>
            <input id="identifier" name="identifier" required className="venrix-input" />
          </div>
          <div>
            <label className="venrix-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="venrix-input"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button type="submit" variant="secondary" disabled={loading} className="w-full">
            {loading ? "Accesso in corso..." : "Accedi come staff"}
          </Button>
        </form>
      </div>
    </div>
  );
}
