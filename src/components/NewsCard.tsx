import Image from "next/image";
import Link from "next/link";
import { IconNewspaper, IconChevronRight } from "@/components/icons";

export type NewsCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  createdAt: string | Date;
};

export function NewsCard({ news }: { news: NewsCardData }) {
  const date = new Date(news.createdAt).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      href={`/news/${news.slug}`}
      className="venrix-card group flex flex-col overflow-hidden transition hover:border-venrix-500/50"
    >
      <div className="relative h-44 w-full overflow-hidden bg-ink-800">
        {news.coverImage ? (
          <Image
            src={news.coverImage}
            alt={news.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-venrix-radial text-venrix-500/50">
            <IconNewspaper className="h-12 w-12" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-medium uppercase tracking-wide text-venrix-400">
          {date}
        </span>
        <h3 className="mt-1.5 line-clamp-2 font-display text-sm leading-relaxed text-white">
          {news.title}
        </h3>
        {news.excerpt && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-400">{news.excerpt}</p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-venrix-300 group-hover:text-venrix-200">
          Leggi di più <IconChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
