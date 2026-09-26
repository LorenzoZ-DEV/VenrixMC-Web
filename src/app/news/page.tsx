import type { Metadata } from "next";
import { NewsCard } from "@/components/NewsCard";
import { Pagination } from "@/components/Pagination";
import { getNewsPage } from "@/lib/news";

export const metadata: Metadata = { title: "News · VenrixMC" };
export const dynamic = "force-dynamic";

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Number(searchParams.page ?? "1") || 1;
  const { items, totalPages } = await getNewsPage(page);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-xl text-white sm:text-2xl">News</h1>
      <p className="mt-2 text-slate-400">Tutti gli aggiornamenti, eventi e annunci di VenrixMC.</p>

      {items.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <NewsCard key={n.slug} news={n} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-slate-500">Nessuna news pubblicata al momento.</p>
      )}

      <Pagination basePath="/news" currentPage={page} totalPages={totalPages} />
    </div>
  );
}
