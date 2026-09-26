"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconCheck, IconChat, PixelFrame } from "@/components/icons";

type ProfileUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
};

const DISCORD_ERROR_MESSAGES: Record<string, string> = {
  missing_params: "Risposta Discord incompleta, riprova.",
  invalid_state: "Sessione di collegamento scaduta, riprova.",
  already_linked: "Questo account Discord è già collegato a un altro utente.",
  exchange_failed: "Impossibile completare il collegamento con Discord.",
  not_configured: "Il collegamento Discord non è configurato su questo sito.",
};

function DiscordStatusBanner() {
  const params = useSearchParams();
  const discord = params.get("discord");
  if (!discord) return null;

  if (discord === "linked") {
    return (
      <div className="venrix-card mb-6 flex items-center gap-2 border-l-4 border-l-emerald-500/60 p-4 text-sm text-emerald-300">
        <IconCheck className="h-4 w-4 shrink-0" /> Account Discord collegato con successo.
      </div>
    );
  }

  const reason = params.get("reason") ?? "";
  return (
    <div className="venrix-card mb-6 border-l-4 border-l-red-500/60 p-4 text-sm text-red-300">
      {DISCORD_ERROR_MESSAGES[reason] ?? "Impossibile collegare l'account Discord."}
    </div>
  );
}

export function ProfileForm({ user, discordConfigured }: { user: ProfileUser; discordConfigured: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("Le due password non coincidono");
      return;
    }

    setStatus("loading");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        ...(username !== user.username ? { username } : {}),
        ...(email !== user.email ? { email } : {}),
        ...(newPassword ? { newPassword } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Errore durante il salvataggio");
      setStatus("idle");
      return;
    }

    setStatus("success");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    router.refresh();
    setTimeout(() => setStatus("idle"), 2500);
  }

  async function unlinkDiscord() {
    setUnlinking(true);
    await fetch("/api/profile/discord", { method: "DELETE" });
    setUnlinking(false);
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-6">
      <Suspense fallback={null}>
        <DiscordStatusBanner />
      </Suspense>

      <form onSubmit={handleSubmit} className="venrix-card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-white">Il tuo account</h2>
          <Badge tone="role">{user.role}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="venrix-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="venrix-input"
              value={username}
              minLength={3}
              maxLength={32}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="venrix-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="venrix-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="venrix-label" htmlFor="newPassword">
              Nuova password (opzionale)
            </label>
            <input
              id="newPassword"
              type="password"
              className="venrix-input"
              value={newPassword}
              minLength={8}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="venrix-label" htmlFor="confirmPassword">
              Conferma nuova password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="venrix-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="venrix-label" htmlFor="currentPassword">
            Password attuale *
          </label>
          <input
            id="currentPassword"
            type="password"
            required
            className="venrix-input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Necessaria per confermare qualsiasi modifica"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {status === "success" && (
          <p className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <IconCheck className="h-3.5 w-3.5" /> Profilo aggiornato
          </p>
        )}

        <Button type="submit" disabled={status === "loading"} className="w-full">
          {status === "loading" ? "Salvataggio..." : "Salva modifiche"}
        </Button>
      </form>

      <div className="venrix-card p-6">
        <h2 className="font-display text-base font-semibold text-white">Discord</h2>

        {user.discordId ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user.discordAvatar ? (
                <Image
                  src={user.discordAvatar}
                  alt={user.discordUsername ?? "Discord"}
                  width={40}
                  height={40}
                  className="pixel-corners-sm h-10 w-10 border border-white/10"
                />
              ) : (
                <PixelFrame className="h-10 w-10 text-venrix-300">
                  <IconChat className="h-5 w-5" />
                </PixelFrame>
              )}
              <div>
                <p className="text-sm font-medium text-white">{user.discordUsername}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Collegato</p>
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={unlinkDiscord} disabled={unlinking}>
              {unlinking ? "..." : "Scollega"}
            </Button>
          </div>
        ) : discordConfigured ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">Nessun account Discord collegato.</p>
            <a href="/api/auth/discord/start" className="venrix-btn-secondary">
              <IconChat className="h-4 w-4" /> Collega con Discord
            </a>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Il collegamento con Discord non è configurato su questo sito.
          </p>
        )}
      </div>
    </div>
  );
}
