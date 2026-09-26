import type { ReactNode } from "react";

/**
 * Intestazione di una pagina della dashboard.
 *
 * Prima ogni pagina si scriveva la sua: tredici usavano `text-lg`, tre
 * `text-2xl font-bold`, alcune avevano un sottotitolo e altre no, e nessuna
 * aveva un posto per i pulsanti. Passando da qui la scala e' una sola e
 * `actions` da' alle azioni principali un posto fisso, in alto a destra,
 * dove si va a cercarle.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.03em] text-white sm:text-[28px]">
          {title}
        </h1>
        {description && (
          // Misura di riga anche qui: una descrizione a tutta larghezza su
          // uno schermo grande diventa illeggibile.
          <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
