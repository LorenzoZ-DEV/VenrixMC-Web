import type { ReactNode } from "react";
import { PixelFrame } from "@/components/icons";

export function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "text-amber-300"
      : tone === "success"
        ? "text-emerald-300"
        : "text-white";

  return (
    <div className="venrix-card flex items-center gap-4 p-5">
      <PixelFrame className="h-12 w-12 text-venrix-300">{icon}</PixelFrame>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className={`font-display text-lg ${toneClass}`}>{value}</p>
      </div>
    </div>
  );
}
