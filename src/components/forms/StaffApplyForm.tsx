import { Button, LinkButton } from "@/components/ui/Button";
import { IconChat, PixelFrame } from "@/components/icons";
import { STAFF_POSITION_ICONS } from "@/lib/staffPositionIcons";
import type { StaffPositionData } from "@/lib/staffPositions";

type StaffPosition = StaffPositionData;

function PositionCard({
  position,
  blockedReason,
}: {
  position: StaffPosition;
  blockedReason: string | null;
}) {
  const Icon = STAFF_POSITION_ICONS[position.icon] ?? IconChat;

  return (
    <div className={`venrix-card flex flex-col p-5 transition ${position.open ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <PixelFrame className="h-10 w-10 text-venrix-300">
            <Icon className="h-5 w-5" />
          </PixelFrame>
          <h3 className="font-display text-base font-semibold text-white">{position.title}</h3>
        </div>
        <span
          className={`pixel-corners-sm border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
            position.open
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
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

      {position.open && blockedReason ? (
        <Button type="button" variant="secondary" className="mt-5 w-full" disabled>
          {blockedReason}
        </Button>
      ) : position.open && position.wizardId ? (
        <LinkButton
          href={`/staff-apply/${position.wizardId}`}
          variant="primary"
          className="mt-5 w-full"
        >
          Candidati per questo ruolo
        </LinkButton>
      ) : (
        // Senza un modulo dedicato (wizardId) non c'e piu un form generico
        // dove mandare il candidato: la posizione resta solo consultabile.
        <Button type="button" variant="secondary" className="mt-5 w-full" disabled>
          {position.open ? "Modulo non disponibile" : "Posizione chiusa"}
        </Button>
      )}
    </div>
  );
}

/**
 * Le posizioni staff con il link al modulo dedicato di ciascuna.
 * `blockedReason` non nullo significa che adesso non ci si puo candidare
 * (accesso mancante o candidatura gia inviata negli ultimi 14 giorni): le
 * posizioni restano consultabili, ma i pulsanti si spengono.
 */
export function StaffApplyForm({
  positions,
  blockedReason,
}: {
  positions: StaffPosition[];
  blockedReason: string | null;
}) {
  const openCount = positions.filter((p) => p.open).length;

  return (
    <div>
      <p className="font-display text-base font-semibold text-venrix-300">
        {openCount} posizion{openCount === 1 ? "e aperta" : "i aperte"} in questo momento
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {positions.map((position) => (
          <PositionCard key={position.id} position={position} blockedReason={blockedReason} />
        ))}
      </div>
    </div>
  );
}
