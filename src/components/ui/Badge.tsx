import clsx from "clsx";

const TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  denied: "bg-red-500/15 text-red-300 border-red-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  neutral: "bg-white/10 text-slate-300 border-white/10",
  role: "bg-venrix-600/20 text-venrix-200 border-venrix-500/30",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONE; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
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
  if (s === "approved") return "approved";
  if (s === "denied" || s === "rejected") return "denied";
  return "neutral";
}
