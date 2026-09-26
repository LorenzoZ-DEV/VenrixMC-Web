import type { ReactNode } from "react";
import { PixelFrame } from "@/components/icons";

/**
 * La tessera di statistica della dashboard. Il numero e' il contenuto, non
 * l'etichetta: sta nel font a pixel e a corpo grande, mentre la didascalia
 * resta piccola sopra. Prima erano della stessa dimensione e il pannello
 * si leggeva come un elenco di parole invece che di cifre.
 */
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
    tone === "warning" ? "text-amber-300" : tone === "success" ? "text-emerald-300" : "text-white";

  return (
    <div className="venrix-card flex items-center gap-4 p-5">
      <PixelFrame className="h-12 w-12 text-venrix-300">{icon}</PixelFrame>
      <div className="min-w-0">
        <p className="mono-label truncate text-slate-400">{label}</p>
        {/* tabular: nelle griglie di quattro tessere le cifre restano
            incolonnate anche quando i valori cambiano di ordine di
            grandezza. */}
        <p className={`tabular mt-1 font-display text-3xl font-bold ${toneClass}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
