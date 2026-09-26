"use client";

import { useState } from "react";
import clsx from "clsx";
import { IconCopy, IconCheck } from "@/components/icons";
import { SITE } from "@/lib/constants";

/**
 * Il campo "IP del server" con il bottone per copiarlo. Esiste una sola
 * implementazione perche' l'indirizzo compare in due punti della home (il
 * pannello dell'hero e il secondo passo di "Come giocare"): due copie del
 * codice avrebbero preso strade diverse alla prima modifica.
 *
 * `size="lg"` e' la versione dei passi, dove l'indirizzo e' il contenuto
 * principale del riquadro e non un dato fra gli altri.
 */
export function CopyIp({ size = "md" }: { size?: "md" | "lg" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(SITE.serverIp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API non disponibile (contesto non sicuro): nessun feedback,
      // ma l'indirizzo resta selezionabile a mano.
    }
  }

  return (
    <div>
      <div
        className={clsx(
          "venrix-input flex items-center justify-between gap-2 font-mono text-white",
          size === "lg" ? "py-2 pr-2 text-base sm:text-lg" : "py-1.5 pr-1.5 text-sm"
        )}
      >
        <span className="truncate">{SITE.serverIp}</span>
        <button
          onClick={handleCopy}
          // L'etichetta passa da "copia" a "copiato": senza, chi usa uno
          // screen reader non ha modo di sapere che il click e' andato.
          aria-label={copied ? "IP del server copiato" : "Copia IP del server"}
          className={clsx(
            "btn-base shrink-0 bg-venrix-600 text-onbrand hover:bg-venrix-400",
            size === "lg" ? "h-10 w-10" : "h-8 w-8"
          )}
        >
          {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
        </button>
      </div>
      <p
        aria-live="polite"
        className={clsx(
          "mt-2 text-[12px] font-medium text-emerald-400 transition-opacity duration-150",
          copied ? "opacity-100" : "opacity-0"
        )}
      >
        IP copiato negli appunti
      </p>
    </div>
  );
}
