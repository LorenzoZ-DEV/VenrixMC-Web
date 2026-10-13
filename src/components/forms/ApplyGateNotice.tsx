import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { IconClipboard, IconKey, IconShield, PixelFrame } from "@/components/icons";
import { APPLY_COOLDOWN_DAYS, formatItDate, type ApplyGate } from "@/lib/applyCooldown";

/**
 * Quello che vede chi non puo candidarsi adesso:
 *  - senza accesso: l'invito a entrare con Discord;
 *  - in blacklist: il blocco e il motivo, senza date ne inviti a riprovare;
 *  - entro i 14 giorni: lo stato della sua ultima candidatura e la data da
 *    cui potra riprovare.
 */
export function ApplyGateNotice({
  gate,
  next,
}: {
  gate: Exclude<ApplyGate, { state: "open" }>;
  next: string;
}) {
  if (gate.state === "guest") {
    return (
      <div className="venrix-card flex flex-col items-center gap-3 p-8 text-center">
        <PixelFrame className="h-12 w-12 text-venrix-300">
          <IconKey className="h-6 w-6" />
        </PixelFrame>
        <p className="font-display text-base font-semibold text-white">Accedi per candidarti</p>
        <p className="max-w-md text-sm text-slate-400">
          Per inviare una candidatura serve l&apos;accesso con Discord: così potrai seguirne lo
          stato dalla tua dashboard.
        </p>
        <Link
          href={`/forum/accedi?next=${encodeURIComponent(next)}`}
          className="venrix-btn-primary mt-2"
        >
          Accedi con Discord
        </Link>
      </div>
    );
  }

  /*
   * Blacklist: nessuna data, nessun invito a riprovare e nessun link alle
   * proprie richieste. Chi e' escluso non ha un'azione utile da compiere qui,
   * e offrirgliene una sarebbe una risposta falsa. Il motivo si mostra per
   * esteso: e' l'unica cosa che gli serve sapere, e su cui puo' aprire un
   * discorso con lo staff.
   */
  if (gate.state === "blacklisted") {
    return (
      <div className="venrix-card flex flex-col items-center gap-3 p-8 text-center">
        <PixelFrame className="h-12 w-12 text-red-600 dark:text-red-400">
          <IconShield className="h-6 w-6" />
        </PixelFrame>
        <p className="font-display text-base font-semibold text-red-600 dark:text-red-400">
          Candidatura bloccata per blacklist staff
        </p>
        <p className="max-w-md text-sm text-slate-400">
          Il tuo account è escluso dalle candidature come membro dello staff.
        </p>
        <div className="mt-1 w-full max-w-md rounded-lg border border-red-500/25 bg-red-500/10 p-4 text-left">
          <p className="mono-label text-red-600 dark:text-red-400">Motivo</p>
          <p className="mt-1.5 whitespace-pre-line text-sm text-slate-200">{gate.reason}</p>
        </div>
        <p className="mt-1 max-w-md text-[13px] text-slate-500">
          Se pensi che sia un errore, parlane con lo staff sul Discord del server.
        </p>
      </div>
    );
  }

  return (
    <div className="venrix-card flex flex-col items-center gap-3 p-8 text-center">
      <PixelFrame className="h-12 w-12 text-amber-600 dark:text-amber-400">
        <IconClipboard className="h-6 w-6" />
      </PixelFrame>
      <p className="font-display text-base font-semibold text-amber-600 dark:text-amber-400">
        Candidatura già inviata
      </p>
      <p className="max-w-md text-sm text-slate-400">
        Hai inviato una candidatura come <span className="text-white">{gate.roles}</span> il{" "}
        {formatItDate(gate.createdAt)}. Puoi candidarti una volta ogni {APPLY_COOLDOWN_DAYS}{" "}
        giorni: la prossima potrai inviarla dal{" "}
        <span className="text-white">{formatItDate(gate.nextAt)}</span>.
      </p>
      <StatusBadge status={gate.status} />
      <Link href="/dashboard/richieste" className="venrix-btn-secondary mt-2">
        Vedi le mie richieste
      </Link>
    </div>
  );
}
