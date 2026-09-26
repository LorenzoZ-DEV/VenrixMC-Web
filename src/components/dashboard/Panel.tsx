import type { ReactNode } from "react";
import clsx from "clsx";

/**
 * Riquadro della dashboard, con la sua intestazione.
 *
 * I pannelli erano `div.venrix-card` nudi: dentro ci finivano tabelle e
 * moduli senza niente che dicesse cosa fossero, e ogni pagina inventava la
 * propria intestazione (o non ne metteva). Qui titolo, descrizione e azioni
 * hanno un posto stabile, e il corpo resta libero.
 *
 * `flush` toglie il padding al corpo: serve alle tabelle, che devono
 * arrivare a filo dei bordi del riquadro invece di galleggiarci dentro.
 */
export function Panel({
  title,
  description,
  actions,
  flush = false,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  flush?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const hasHeader = Boolean(title || actions);

  return (
    <section className={clsx("venrix-card overflow-hidden", className)}>
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-base font-bold text-white">{title}</h2>
            )}
            {description && (
              <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-slate-400">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}
