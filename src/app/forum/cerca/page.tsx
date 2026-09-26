import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { searchTopics } from "@/lib/forum";
import { contentPreview, timeAgo } from "@/lib/forumFormat";
import { Pagination } from "@/components/Pagination";
import { MemberAvatar } from "@/components/forum/MemberAvatar";
import { TagPill } from "@/components/forum/TagPill";
import { IconChat, IconEye } from "@/components/icons";

export const metadata: Metadata = { title: "Ricerca · Forum VenrixMC" };
export const dynamic = "force-dynamic";

export default async function ForumSearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q?.trim() ?? "";
  const page = Number(searchParams.page ?? "1") || 1;
  const session = await getSession();

  // Sotto i due caratteri la ricerca restituirebbe mezzo forum: meglio
  // chiedere di scrivere qualcosa in piu.
  const results =
    query.length >= 2 ? await searchTopics(session, query, page) : { items: [], total: 0, totalPages: 1 };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="font-display text-xl font-bold text-white">Ricerca nel forum</h1>
        {query.length >= 2 && (
          <p className="mt-1 text-sm text-slate-400">
            {results.total} {results.total === 1 ? "risultato" : "risultati"} per{" "}
            <span className="text-venrix-300">&ldquo;{query}&rdquo;</span>
          </p>
        )}
      </header>

      {query.length < 2 ? (
        <div className="venrix-card p-10 text-center text-sm text-slate-500">
          Scrivi almeno due caratteri nella barra di ricerca in alto.
        </div>
      ) : results.items.length === 0 ? (
        <div className="venrix-card p-10 text-center text-sm text-slate-500">
          Nessuna discussione corrisponde alla ricerca.
        </div>
      ) : (
        <div className="venrix-card divide-y divide-white/5 overflow-hidden">
          {results.items.map((topic) => (
            <article key={topic.slug} className="flex gap-4 p-4 transition hover:bg-white/[0.03]">
              <MemberAvatar user={topic.author} size={40} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {topic.tags.map((tag) => (
                    <TagPill key={tag.id} tag={tag} />
                  ))}
                  <Link
                    href={`/forum/${topic.board.slug}/${topic.slug}`}
                    className="font-display text-[15px] font-semibold text-white hover:text-venrix-300"
                  >
                    {topic.title}
                  </Link>
                </div>

                {topic.posts[0] && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                    {contentPreview(topic.posts[0].content, 220)}
                  </p>
                )}

                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Link
                    href={`/forum/${topic.board.slug}`}
                    className="font-medium text-slate-400 hover:text-venrix-300"
                  >
                    {topic.board.name}
                  </Link>
                  <span>· {topic.author.username}</span>
                  <span>· {timeAgo(topic.lastPostAt)}</span>
                  <span className="inline-flex items-center gap-1">
                    <IconChat className="h-3 w-3" /> {topic.replyCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <IconEye className="h-3 w-3" /> {topic.views}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination
        basePath="/forum/cerca"
        currentPage={page}
        totalPages={results.totalPages}
        query={{ q: query }}
      />
    </div>
  );
}
