import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { getNewsBySlug } from "@/lib/news";
import { IconChevronLeft } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const news = await getNewsBySlug(params.slug);
  if (!news) return { title: "News — VenrixMC" };
  return { title: `${news.title} — VenrixMC`, description: news.excerpt ?? undefined };
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const news = await getNewsBySlug(params.slug);
  if (!news) notFound();

  const clean = DOMPurify.sanitize(news.content);
  const date = new Date(news.createdAt).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-sm font-semibold text-venrix-300 hover:text-venrix-200"
      >
        <IconChevronLeft className="h-3.5 w-3.5" /> Tutte le news
      </Link>

      <h1 className="mt-4 font-display text-xl text-white sm:text-2xl">
        {news.title}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {date} · di {news.author.username}
      </p>

      {news.coverImage && (
        <div className="pixel-corners relative mt-6 h-72 w-full overflow-hidden border-2 border-black/40">
          <Image src={news.coverImage} alt={news.title} fill className="object-cover" />
        </div>
      )}

      <div
        className="prose prose-invert prose-purple mt-8 max-w-none prose-headings:font-display prose-a:text-venrix-300"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </article>
  );
}
