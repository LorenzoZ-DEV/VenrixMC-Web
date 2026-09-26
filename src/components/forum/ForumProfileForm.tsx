"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Profile = {
  minecraftName: string | null;
  bio: string | null;
  signature: string | null;
};

/** Profilo pubblico del membro: nick in gioco, presentazione e firma. */
export function ForumProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [minecraftName, setMinecraftName] = useState(profile.minecraftName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [signature, setSignature] = useState(profile.signature ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);

    try {
      const res = await fetch("/api/forum/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minecraftName, bio, signature }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossibile salvare il profilo.");
        setStatus("idle");
        return;
      }

      setStatus("saved");
      router.refresh();
    } catch {
      setError("Impossibile contattare il server, riprova più tardi.");
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="venrix-card space-y-5 p-6">
      <div>
        <label className="venrix-label" htmlFor="minecraftName">
          Nickname Minecraft
        </label>
        <input
          id="minecraftName"
          value={minecraftName}
          onChange={(e) => setMinecraftName(e.target.value)}
          maxLength={16}
          placeholder="Es. Notch"
          className="venrix-input"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Da qui arrivano la tua skin e la testa mostrata accanto ai messaggi.
        </p>
      </div>

      <div>
        <label className="venrix-label" htmlFor="bio">
          Presentazione
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={1000}
          rows={5}
          placeholder="Due righe su di te, visibili sul tuo profilo."
          className="venrix-input resize-y"
        />
      </div>

      <div>
        <label className="venrix-label" htmlFor="signature">
          Firma
        </label>
        <input
          id="signature"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          maxLength={300}
          placeholder="Appare sotto ogni tuo messaggio."
          className="venrix-input"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {status === "saved" && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Profilo aggiornato.</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={status === "saving"}>
          {status === "saving" ? "Salvataggio…" : "Salva"}
        </Button>
      </div>
    </form>
  );
}
