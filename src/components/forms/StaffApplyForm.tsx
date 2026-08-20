"use client";

import { FormEvent, useRef, useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { IconCheck, IconChat, PixelFrame } from "@/components/icons";
import { STAFF_POSITION_ICONS } from "@/lib/staffPositionIcons";
import type { StaffPositionData } from "@/lib/staffPositions";

type StaffPosition = StaffPositionData;

const OTHER_ROLE = "__other__";

function PositionCard({
  position,
  selected,
  onSelect,
}: {
  position: StaffPosition;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = STAFF_POSITION_ICONS[position.icon] ?? IconChat;

  return (
    <div
      className={`venrix-card flex flex-col p-5 transition ${
        selected ? "border-venrix-500" : position.open ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <PixelFrame className="h-10 w-10 text-venrix-300">
            <Icon className="h-5 w-5" />
          </PixelFrame>
          <h3 className="font-display text-xs text-white">{position.title}</h3>
        </div>
        <span
          className={`pixel-corners-sm border-2 px-2 py-1 text-[9px] font-display uppercase ${
            position.open
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-white/10 bg-white/5 text-slate-500"
          }`}
        >
          {position.open
            ? `Aperta · ${position.slots} post${position.slots === 1 ? "o" : "i"}`
            : "Chiusa"}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">{position.tagline}</p>

      <ul className="mt-4 flex-1 space-y-1.5 text-xs text-slate-400">
        {position.requirements.map((req) => (
          <li key={req} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-venrix-500" />
            {req}
          </li>
        ))}
      </ul>

      {position.open && position.wizardId ? (
        <LinkButton
          href={`/staff-apply/${position.wizardId}`}
          variant="primary"
          className="mt-5 w-full"
        >
          Candidati per questo ruolo
        </LinkButton>
      ) : (
        <Button
          type="button"
          variant={selected ? "primary" : "secondary"}
          className="mt-5 w-full"
          disabled={!position.open}
          onClick={onSelect}
        >
          {position.open ? "Candidati per questo ruolo" : "Posizione chiusa"}
        </Button>
      )}
    </div>
  );
}

export function StaffApplyForm({ positions }: { positions: StaffPosition[] }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const openCount = positions.filter((p) => p.open).length;

  function pickPosition(position: StaffPosition) {
    setSelectedRole(position.title);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const form = new FormData(e.currentTarget);
    const roleValue = selectedRole === OTHER_ROLE ? customRole : selectedRole;
    const payload = {
      minecraftName: form.get("minecraftName"),
      discord: form.get("discord"),
      age: form.get("age"),
      roles: roleValue,
      experience: form.get("experience"),
      message: form.get("message"),
    };

    try {
      const res = await fetch("/api/staff-apply", {
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
      setSelectedRole("");
      setCustomRole("");
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
        <p className="font-display text-xs text-emerald-400">Candidatura inviata</p>
        <p className="text-sm text-slate-400">
          Grazie per il tuo interesse! Il nostro Head Staff la esaminerà a breve.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="font-display text-xs text-venrix-300">
          {openCount} posizion{openCount === 1 ? "e aperta" : "i aperte"} in questo momento
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {positions.map((position) => (
            <PositionCard
              key={position.id}
              position={position}
              selected={selectedRole === position.title}
              onSelect={() => pickPosition(position)}
            />
          ))}
        </div>
      </div>

      <div className="venrix-card border-l-4 border-l-amber-500/60 p-4 text-sm text-slate-300">
        Rispondi con sincerità: candidature copiate da altre richieste, o palesemente false,
        vengono scartate senza revisione.
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="venrix-card scroll-mt-24 space-y-4 p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
            <label className="venrix-label" htmlFor="discord">
              Discord *
            </label>
            <input
              id="discord"
              name="discord"
              required
              className="venrix-input"
              placeholder="username"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="venrix-label" htmlFor="age">
              Età *
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min={10}
              max={99}
              required
              className="venrix-input"
            />
          </div>
          <div>
            <label className="venrix-label" htmlFor="roles">
              Ruolo desiderato *
            </label>
            <select
              id="roles"
              name="roles"
              required
              className="venrix-input"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="" disabled>
                Seleziona una posizione
              </option>
              {positions
                .filter((position) => !position.wizardId)
                .map((position) => (
                  <option key={position.id} value={position.title} disabled={!position.open}>
                    {position.title}
                    {!position.open ? " (chiusa)" : ""}
                  </option>
                ))}
              <option value={OTHER_ROLE}>Altro</option>
            </select>
          </div>
        </div>

        {selectedRole === OTHER_ROLE && (
          <div>
            <label className="venrix-label" htmlFor="customRole">
              Specifica il ruolo *
            </label>
            <input
              id="customRole"
              required
              className="venrix-input"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="venrix-label" htmlFor="experience">
            Esperienza pregressa *
          </label>
          <textarea
            id="experience"
            name="experience"
            required
            minLength={20}
            maxLength={3000}
            rows={4}
            className="venrix-input resize-none"
            placeholder="Hai già fatto staff su altri server? Racconta la tua esperienza..."
          />
        </div>

        <div>
          <label className="venrix-label" htmlFor="message">
            Perché vuoi entrare nello staff? *
          </label>
          <textarea
            id="message"
            name="message"
            required
            minLength={20}
            maxLength={3000}
            rows={4}
            className="venrix-input resize-none"
            placeholder="Motiva la tua candidatura..."
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" disabled={status === "loading"} className="w-full">
          {status === "loading" ? "Invio in corso..." : "Invia candidatura"}
        </Button>
      </form>
    </div>
  );
}
