import Link from "next/link";
import clsx from "clsx";
import { CoverImage } from "@/components/ui/CoverImage";
import { IconNewspaper, IconChevronRight } from "@/components/icons";

export type NewsCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  createdAt: string | Date;
};

/**
 * `featured` e' la versione grande usata come apertura della griglia news:
 * stessa card, immagine piu' alta e titolo di un gradino superiore. Non e'
 * un componente separato apposta, cosi' le due varianti non divergono.
 */
export function NewsCard({
  news,
  featured = false,
}: {
  news: NewsCardData;
  featured?: boolean;
}) {
  const created = new Date(news.createdAt);
  const date = created.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      href={`/news/${news.slug}`}
      className="venrix-card group flex h-full flex-col overflow-hidden"
    >
      <div
        className={clsx(
          "relative w-full shrink-0 overflow-hidden bg-ink-800",
          featured ? "h-56 sm:h-72" : "h-44"
        )}
      >
        {news.coverImage ? (
          <CoverImage
            src={news.coverImage}
            alt={news.title}
            sizes={featured ? "(max-width: 1024px) 100vw, 60vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-venrix-500/40">
            <div className="absolute inset-0 bg-venrix-radial" />
            <IconNewspaper className={featured ? "relative h-16 w-16" : "relative h-12 w-12"} />
          </div>
        )}
        {/* Velo in basso: l'immagine non finisce di taglio contro il testo. */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-700/70 to-transparent" />
      </div>

      <div className={clsx("flex flex-1 flex-col", featured ? "p-7" : "p-5")}>
        <time
          dateTime={created.toISOString()}
          className="mono-label tabular text-venrix-200"
        >
          {date}
        </time>

        <h3
          className={clsx(
            "mt-3 font-display font-bold leading-[1.18] text-white",
            featured ? "line-clamp-3 text-[24px] sm:text-[28px]" : "line-clamp-2 text-lg"
          )}
        >
          {news.title}
        </h3>

        {news.excerpt && (
          <p
            className={clsx(
              "mt-3 text-[15px] leading-relaxed text-slate-400",
              featured ? "line-clamp-3" : "line-clamp-2"
            )}
          >
            {news.excerpt}
          </p>
        )}

        {/* mt-auto tiene l'invito all'azione incollato in basso: nella griglia
            gli inviti di tutte le card restano cosi' sulla stessa riga anche
            con titoli di lunghezza diversa. */}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-venrix-300">
          Leggi di più
          <IconChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
