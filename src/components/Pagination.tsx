import Link from "next/link";
import clsx from "clsx";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

export function Pagination({
  basePath,
  currentPage,
  totalPages,
  query,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  /** Parametri da riportare in ogni link (filtro etichetta, ricerca, ...). */
  query?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const href = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value) params.set(key, value);
    }
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav className="mt-10 flex items-center justify-center gap-2">
      <Link
        href={href(Math.max(1, currentPage - 1))}
        className={clsx(
          "flex items-center gap-1 px-3 py-2 text-sm",
          currentPage === 1
            ? "pointer-events-none text-slate-600"
            : "text-slate-300 hover:bg-white/10"
        )}
      >
        <IconChevronLeft className="h-3.5 w-3.5" /> Prec
      </Link>

      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          className={clsx(
            "pixel-corners-sm h-9 w-9 border text-center text-sm leading-[2.15rem]",
            p === currentPage
              ? "border-white/10 bg-venrix-600 font-semibold text-onbrand"
              : "border-transparent text-slate-300 hover:bg-white/10"
          )}
        >
          {p}
        </Link>
      ))}

      <Link
        href={href(Math.min(totalPages, currentPage + 1))}
        className={clsx(
          "flex items-center gap-1 px-3 py-2 text-sm",
          currentPage === totalPages
            ? "pointer-events-none text-slate-600"
            : "text-slate-300 hover:bg-white/10"
        )}
      >
        Succ <IconChevronRight className="h-3.5 w-3.5" />
      </Link>
    </nav>
  );
}
