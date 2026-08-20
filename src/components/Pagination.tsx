import Link from "next/link";
import clsx from "clsx";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

export function Pagination({
  basePath,
  currentPage,
  totalPages,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-10 flex items-center justify-center gap-2">
      <Link
        href={`${basePath}?page=${Math.max(1, currentPage - 1)}`}
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
          href={`${basePath}?page=${p}`}
          className={clsx(
            "pixel-corners-sm h-9 w-9 border-2 text-center text-sm leading-[2.15rem]",
            p === currentPage
              ? "border-black/40 bg-venrix-600 font-semibold text-white"
              : "border-transparent text-slate-300 hover:bg-white/10"
          )}
        >
          {p}
        </Link>
      ))}

      <Link
        href={`${basePath}?page=${Math.min(totalPages, currentPage + 1)}`}
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
