import clsx from "clsx";

// Il testo ha due tinte perche una pastello leggibile sul fondo scuro
// sparisce sulla stessa velatura in tema chiaro, e viceversa.
const TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  denied: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  neutral: "bg-white/10 text-slate-300 border-white/10",
  // Nero in entrambi i temi: una candidatura ritirata non e' ne un si ne un
  // no, e non deve prendersi il colore di un esito.
  withdrawn: "bg-slate-900 text-slate-200 border-slate-700 dark:bg-black dark:text-slate-400 dark:border-white/20",
  role: "bg-venrix-600/15 text-venrix-200 border-venrix-500/30",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONE; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        TONE[tone]
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof TONE {
  const s = status.toLowerCase();
  if (s === "pending") return "pending";
  // La scritta accettata non e' ancora un "si" pieno: l'orale deve ancora
  // arrivare, quindi la targhetta resta in attesa finche' non e' deciso.
  if (s === "approved") return "pending";
  if (s === "interview_passed") return "approved";
  if (s === "denied" || s === "rejected" || s === "interview_rejected") return "denied";
  if (s === "withdrawn") return "withdrawn";
  return "neutral";
}

// Etichetta italiana degli stati di candidature e appeal: la targhetta non
// deve mostrare il nome grezzo dell'enum (REJECTED, APPROVED...).
const STATUS_LABEL: Record<string, string> = {
  PENDING: "In attesa",
  APPROVED: "Accettata",
  REJECTED: "Respinta",
  DENIED: "Respinta",
  INTERVIEW_PASSED: "Accettata",
  INTERVIEW_REJECTED: "Respinta",
  WITHDRAWN: "Annullata",
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status.toUpperCase()] ?? status;
}

// Riga sotto la targhetta: la sola etichetta non basta a distinguere le due
// fasi di una candidatura staff (scritta e orale), che possono finire
// entrambe con "Accettata" o "Respinta".
const STATUS_HINT: Record<string, string> = {
  APPROVED: "In attesa candidatura orale",
  REJECTED: "Candidatura scritta rifiutata",
  INTERVIEW_PASSED: "Candidatura orale superata",
  INTERVIEW_REJECTED: "Candidatura orale rifiutata",
  WITHDRAWN: "Ritirata dal giocatore",
};

export function statusHint(status: string): string | null {
  return STATUS_HINT[status.toUpperCase()] ?? null;
}

/** La targhetta con, sotto, la fase a cui si riferisce. */
export function StatusBadge({ status }: { status: string }) {
  const hint = statusHint(status);
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
      {hint && <span className="text-[11px] leading-tight text-slate-500">{hint}</span>}
    </div>
  );
}
