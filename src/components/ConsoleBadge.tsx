import { IconTerminal } from "@/components/icons";

/** Badge rosso con logo terminale per le azioni eseguite dalla Console. */
export function ConsoleBadge({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-red-500/40 bg-red-500/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
      <IconTerminal className={className} />
      Console
    </span>
  );
}
