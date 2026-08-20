"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
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

    router.push(params.get("next") ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-14">
      <div className="venrix-card w-full max-w-sm p-8">
        <div className="flex flex-col items-center">
          <Image
            src="/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"
            alt="VenrixMC"
            width={64}
            height={64}
            className="h-16 w-auto"
          />
          <h1 className="mt-4 font-display text-base text-white">Area Staff</h1>
          <p className="mt-1 text-sm text-slate-400">Accedi al pannello di controllo</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Accesso in corso..." : "Accedi"}
          </Button>
        </form>
      </div>
    </div>
  );
}
