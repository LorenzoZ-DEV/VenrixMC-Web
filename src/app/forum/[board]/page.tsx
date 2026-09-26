import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { getSession } from "@/lib/session";
import {
  getBoardBySlug,
  getBoardTags,
  getBoardTopics,
  getChildBoardStats,
  getStaffRanks,
  rankKey,
} from "@/lib/forum";
import { canViewBoard, canCreateTopic } from "@/lib/forumPermissions";
import { boardIcon } from "@/lib/forumMeta";
import { timeAgo } from "@/lib/forumFormat";
import { Pagination } from "@/components/Pagination";
import { MemberAvatar } from "@/components/forum/MemberAvatar";
import { RankBadge } from "@/components/forum/RankBadge";
import { TagPill } from "@/components/forum/TagPill";
import {
  IconChevronLeft,
  IconChevronRight,
  IconLock,
  IconPin,
  IconEye,
  IconChat,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { board: string };
}): Promise<Metadata> {
  const board = await getBoardBySlug(params.board);
  return { title: board ? `${board.name} · Forum VenrixMC` : "Forum · VenrixMC" };
}

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: { board: string };
  searchParams: { page?: string; tag?: string };
}) {
  const session = await getSession();
  const board = await getBoardBySlug(params.board);

  // Un forum riservato non deve rivelare nemmeno di esistere a chi non puo
  // leggerlo: stessa 404 di uno slug inventato.
  if (!board || !canViewBoard(session, board)) notFound();

  const page = Number(searchParams.page ?? "1") || 1;
  // Le sotto-sezioni che questo visitatore puo effettivamente vedere: il
  // filtro non puo stare nella query perche dipende dalla sessione.
  const children = board.children.filter((child) =>
    canViewBoard(session, { ...child, parent: board })
  );

  const [{ items, totalPages, total }, tags, childStats] = await Promise.all([
    getBoardTopics(board.id, page, searchParams.tag),
    // Qui le etichette servono da filtro, non da scelta: anche quelle che
    // solo lo staff puo applicare vanno mostrate, altrimenti le discussioni
    // marcate "Risolto" resterebbero non filtrabili.
    getBoardTags(board.id, true),
    getChildBoardStats(children.map((c) => c.id)),
  ]);

  const ranks = await getStaffRanks(items.map((t) => t.author));
  const canWrite = canCreateTopic(session, board);
  const Icon = boardIcon(board.icon);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/forum" className="hover:text-venrix-300">
          Forum
        </Link>
        <IconChevronRight className="h-3 w-3" />
        <span>{board.category.name}</span>
        {board.parent && (
          <>
            <IconChevronRight className="h-3 w-3" />
            <Link href={`/forum/${board.parent.slug}`} className="hover:text-venrix-300">
              {board.parent.name}
            </Link>
          </>
        )}
        <IconChevronRight className="h-3 w-3" />
        <span className="text-slate-300">{board.name}</span>
      </nav>

      <div className="venrix-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="pixel-corners-sm flex h-12 w-12 shrink-0 items-center justify-center bg-venrix-600/12 text-venrix-300">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 font-display text-lg font-bold text-white">
            {board.name}
            {board.locked && <IconLock className="h-4 w-4 text-slate-500" />}
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">{board.description}</p>
        </div>

        {canWrite ? (
          <Link
            href={`/forum/${board.slug}/nuova`}
            className="venrix-btn-primary h-10 shrink-0 px-5 py-0 text-sm"
          >
            Nuova discussione
          </Link>
        ) : (
          !session && (
            <Link
              href={`/forum/accedi?next=/forum/${board.slug}`}
              className="venrix-btn-secondary h-10 shrink-0 px-5 py-0 text-sm"
            >
              Accedi per scrivere
            </Link>
          )
        )}
      </div>

      {children.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-venrix-300">
            Sotto-sezioni
          </h2>
          <div className="venrix-card divide-y divide-white/5 overflow-hidden">
            {children.map((child) => {
              const ChildIcon = boardIcon(child.icon);
              const stats = childStats.get(child.id) ?? { topics: 0, posts: 0 };
              return (
                <div
                  key={child.id}
                  className="flex items-center gap-3.5 p-3.5 transition hover:bg-white/[0.03]"
                >
                  <span className="pixel-corners-sm flex h-9 w-9 shrink-0 items-center justify-center bg-venrix-600/12 text-venrix-300">
                    <ChildIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/forum/${child.slug}`}
                      className="font-display text-sm font-semibold text-white hover:text-venrix-300"
                    >
                      {child.name}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{child.description}</p>
                  </div>
                  <p className="shrink-0 text-right text-xs text-slate-500">
                    {stats.topics} discussioni
                    <br />
                    {stats.posts} post
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/forum/${board.slug}`}
            className={clsx(
              "rounded-sm border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition",
              searchParams.tag
                ? "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                : "border-venrix-500/40 bg-venrix-600/15 text-venrix-200"
            )}
          >
            Tutte
          </Link>
          {tags.map((tag) => (
            <TagPill
              key={tag.id}
              tag={tag}
              href={`/forum/${board.slug}?tag=${tag.slug}`}
              active={searchParams.tag === tag.slug}
            />
          ))}
        </div>
      )}

      <div className="venrix-card divide-y divide-white/5 overflow-hidden">
        {items.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            {searchParams.tag
              ? "Nessuna discussione con questa etichetta."
              : "Nessuna discussione qui. Potresti essere il primo."}
          </p>
        ) : (
          items.map((topic) => (
            <article
              key={topic.id}
              className="flex flex-col gap-3 p-4 transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:gap-4"
            >
              <MemberAvatar user={topic.author} size={40} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {topic.pinned && (
                    <IconPin className="h-3.5 w-3.5 text-venrix-400" aria-label="Fissata" />
                  )}
                  {topic.locked && (
                    <IconLock className="h-3.5 w-3.5 text-slate-500" aria-label="Chiusa" />
                  )}
                  {topic.tags.map((tag) => (
                    <TagPill key={tag.id} tag={tag} href={`/forum/${board.slug}?tag=${tag.slug}`} />
                  ))}
                  <Link
                    href={`/forum/${board.slug}/${topic.slug}`}
                    className="font-display text-[15px] font-semibold text-white hover:text-venrix-300"
                  >
                    {topic.title}
                  </Link>
                </div>

                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <Link
                    href={`/forum/utente/${topic.author.username}`}
                    className="font-medium text-slate-400 hover:text-venrix-300"
                  >
                    {topic.author.username}
                  </Link>
                  <RankBadge rank={ranks.get(rankKey(topic.author))} role={topic.author.role} />
                  <span>· aperta {timeAgo(topic.createdAt)}</span>
                </p>
              </div>

              <div className="flex shrink-0 gap-5 text-center sm:w-28">
                <div>
                  <p className="inline-flex items-center gap-1 font-display text-sm font-bold text-white">
                    <IconChat className="h-3 w-3 text-slate-500" />
                    {topic.replyCount}
                  </p>
                  <p className="text-[11px] text-slate-500">risposte</p>
                </div>
                <div>
                  <p className="inline-flex items-center gap-1 font-display text-sm font-bold text-white">
                    <IconEye className="h-3 w-3 text-slate-500" />
                    {topic.views}
                  </p>
                  <p className="text-[11px] text-slate-500">viste</p>
                </div>
              </div>

              <div className="shrink-0 text-xs text-slate-500 sm:w-40 sm:text-right">
                <p className="truncate">
                  {(topic.lastPostBy ?? topic.author).username}
                </p>
                <p>{timeAgo(topic.lastPostAt)}</p>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link href="/forum" className="inline-flex items-center gap-1 hover:text-venrix-300">
          <IconChevronLeft className="h-3 w-3" /> Tutti i forum
        </Link>
        <span>
          {total} {total === 1 ? "discussione" : "discussioni"}
        </span>
      </div>

      <Pagination
        basePath={`/forum/${board.slug}`}
        currentPage={page}
        totalPages={totalPages}
        query={{ tag: searchParams.tag }}
      />
    </div>
  );
}
