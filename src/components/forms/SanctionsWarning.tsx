import { IconShield } from "@/components/icons";

/**
 * Avviso rosso mostrato prima di ogni candidatura: lo storico sanzioni conta
 * nella valutazione, cosi chi ha sanzioni gravi lo sa prima di inviarla.
 */
export function SanctionsWarning() {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-sm border-2 border-red-500/60 bg-red-500/10 p-4 text-sm"
    >
      <IconShield className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
      <div>
        <p className="font-display font-bold uppercase tracking-wide text-red-700 dark:text-red-300">
          ⚠ Attenzione: controlliamo le tue sanzioni
        </p>
        <p className="mt-1 text-red-700 dark:text-red-200">
          Ogni candidatura viene valutata <strong>anche in base allo storico delle sanzioni</strong>{" "}
          (ban, mute, kick e warn) sul server. Se hai sanzioni gravi, la candidatura può essere
          respinta.
        </p>
      </div>
    </div>
  );
}
