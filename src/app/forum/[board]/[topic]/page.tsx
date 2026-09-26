import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  getTopicBySlug,
  getTopicPosts,
  getBoardTags,
  getForumActor,
  getStaffRanks,
  registerTopicView,
  rankKey,
  POSTS_PER_PAGE,
} from "@/lib/forum";
import {
  canViewBoard,
  canReply,
  canEditPost,
  canDeletePost,
  canModerate,
} from "@/lib/forumPermissions";
import { renderForumContent, timeAgo, fullDate } from "@/lib/forumFormat";
import { clientIp } from "@/lib/rateLimit";
import { Pagination } from "@/components/Pagination";
import { MemberAvatar } from "@/components/forum/MemberAvatar";
import { RankBadge } from "@/components/forum/RankBadge";
import { TagPill } from "@/components/forum/TagPill";
import { ReplyForm } from "@/components/forum/ReplyForm";
import { ReactionBar } from "@/components/forum/ReactionBar";
import { PostActions } from "@/components/forum/PostActions";
import { TopicModeration } from "@/components/forum/TopicModeration";
import { TopicTagEditor } from "@/components/forum/TopicTagEditor";
import { IconChevronRight, IconLock, IconPin, IconEye, IconChat } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { topic: string };
}): Promise<Metadata> {
  const topic = await getTopicBySlug(params.topic);
  return { title: topic ? `${topic.title} · Forum VenrixMC` : "Forum · VenrixMC" };
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: { board: string; topic: string };
  searchParams: { page?: string };
}) {
  const session = await getSession();
  const topic = await getTopicBySlug(params.topic);

  // Lo slug della discussione e unico di suo: se il board nell'URL non e
  // quello giusto (link vecchio dopo uno spostamento) la pagina non esiste
  // a quell'indirizzo.
  if (!topic || topic.board.slug !== params.board || !canViewBoard(session, topic.board)) {
    notFound();
  }

  const page = Number(searchParams.page ?? "1") || 1;
  const { items: posts, totalPages, total } = await getTopicPosts(topic.id, page, session?.userId);

  // Una visita per ora per visitatore: senza questo freno basta ricaricare
  // per gonfiare il contatore.
  await registerTopicView(topic.id, session?.userId ?? clientIp(headers()));

  const ranks = await getStaffRanks([topic.author, ...posts.map((p) => p.author)]);

  const moderator = canModerate(session);
  const replyAllowed = canReply(session, topic.board, topic);
  const boards = moderator
    ? await prisma.forumBoard.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: { id: true, name: true },
      })
    : [];

  // Stesse regole della PATCH: lo staff sempre, l'autore finche la
  // discussione e aperta e lui non e silenziato.
  const actor = session ? await getForumActor(session) : null;
  const tagsEditable =
    moderator ||
    (Boolean(actor?.session) && topic.authorId === session?.userId && !topic.locked && !actor?.muted);
  const availableTags = tagsEditable ? await getBoardTags(topic.board.id) : [];

  // Il Markdown diventa HTML qui, sul server: il client non riceve ne il
  // renderer ne il testo non sanitizzato.
  const rendered = await Promise.all(posts.map((post) => renderForumContent(post.content)));

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link href="/forum" className="hover:text-venrix-300">
          Forum
        </Link>
        {topic.board.parent && (
          <>
            <IconChevronRight className="h-3 w-3" />
            <Link href={`/forum/${topic.board.parent.slug}`} className="hover:text-venrix-300">
              {topic.board.parent.name}
            </Link>
          </>
        )}
        <IconChevronRight className="h-3 w-3" />
        <Link href={`/forum/${topic.board.slug}`} className="hover:text-venrix-300">
          {topic.board.name}
        </Link>
        <IconChevronRight className="h-3 w-3" />
        <span className="truncate text-slate-300">{topic.title}</span>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {topic.pinned && <IconPin className="h-4 w-4 text-venrix-400" aria-label="Fissata" />}
          {topic.locked && <IconLock className="h-4 w-4 text-slate-500" aria-label="Chiusa" />}
          {tagsEditable ? (
            <TopicTagEditor
              topicId={topic.id}
              boardSlug={topic.board.slug}
              current={topic.tags}
              available={availableTags}
              moderator={moderator}
            />
          ) : (
            topic.tags.map((tag) => (
              <TagPill key={tag.id} tag={tag} href={`/forum/${topic.board.slug}?tag=${tag.slug}`} />
            ))
          )}
        </div>

        <h1 className="font-display text-xl font-bold text-white sm:text-2xl">{topic.title}</h1>

        <p className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>
            aperta da{" "}
            <Link
              href={`/forum/utente/${topic.author.username}`}
              className="font-medium text-slate-400 hover:text-venrix-300"
            >
              {topic.author.username}
            </Link>{" "}
            {timeAgo(topic.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <IconChat className="h-3 w-3" /> {topic.replyCount} risposte
          </span>
          <span className="inline-flex items-center gap-1">
            <IconEye className="h-3 w-3" /> {topic.views} visualizzazioni
          </span>
        </p>
      </header>

      {moderator && (
        <TopicModeration
          topicId={topic.id}
          pinned={topic.pinned}
          locked={topic.locked}
          boardId={topic.board.id}
          boards={boards}
        />
      )}

      <div className="space-y-4">
        {posts.map((post, index) => {
          const rank = ranks.get(rankKey(post.author));
          const number = (page - 1) * POSTS_PER_PAGE + index + 1;

          return (
            <article
              key={post.id}
              id={`post-${post.id}`}
              className="venrix-card scroll-mt-24 overflow-hidden sm:flex"
            >
              {/* Colonna autore: la "scheda" tipica dei forum classici. */}
              <div className="flex shrink-0 items-center gap-3 border-b border-white/5 bg-ink-700/40 p-4 sm:w-48 sm:flex-col sm:items-center sm:gap-2 sm:border-b-0 sm:border-r sm:text-center">
                <MemberAvatar user={post.author} size={56} className="sm:h-16 sm:w-16" />
                <div className="min-w-0">
                  <Link
                    href={`/forum/utente/${post.author.username}`}
                    className="block truncate font-display text-sm font-semibold text-white hover:text-venrix-300"
                  >
                    {post.author.username}
                  </Link>
                  <RankBadge rank={rank} role={post.author.role} className="mt-1" />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {post.author.postCount} messaggi
                  </p>
                </div>
              </div>

              <div className="min-w-0 flex-1 p-4">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <time dateTime={new Date(post.createdAt).toISOString()}>
                    {fullDate(post.createdAt)} · {timeAgo(post.createdAt)}
                  </time>
                  <span className="text-slate-600">#{number}</span>
                </div>

                <div
                  className="forum-content prose prose-sm max-w-none break-words prose-a:text-venrix-300 prose-pre:bg-ink-900"
                  dangerouslySetInnerHTML={{ __html: rendered[index] }}
                />

                {post.editedAt && (
                  <p className="mt-3 text-[11px] italic text-slate-600">
                    Modificato {timeAgo(post.editedAt)}
                    {post.editedBy && post.editedBy.username !== post.author.username
                      ? ` da ${post.editedBy.username}`
                      : ""}
                  </p>
                )}

                {post.author.signature && (
                  <p className="mt-4 border-t border-white/5 pt-2.5 text-xs italic text-slate-500">
                    {post.author.signature}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <ReactionBar
                    postId={post.id}
                    counts={post.reactionCounts}
                    mine={post.myReaction}
                    canReact={Boolean(session) && post.authorId !== session?.userId}
                  />
                  <PostActions
                    postId={post.id}
                    rawContent={post.content}
                    canEdit={canEditPost(session, post, topic)}
                    canDelete={canDeletePost(session, post, topic)}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Pagination
        basePath={`/forum/${topic.board.slug}/${topic.slug}`}
        currentPage={page}
        totalPages={totalPages}
      />

      {replyAllowed ? (
        <ReplyForm topicId={topic.id} />
      ) : topic.locked ? (
        <div className="venrix-card flex items-center gap-2.5 p-4 text-sm text-slate-400">
          <IconLock className="h-4 w-4 text-slate-500" />
          Questa discussione è chiusa: non si possono aggiungere risposte.
        </div>
      ) : !session ? (
        <div className="venrix-card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-slate-400">
            Accedi con Discord per rispondere a questa discussione.
          </p>
          <Link
            href={`/forum/accedi?next=/forum/${topic.board.slug}/${topic.slug}`}
            className="venrix-btn-primary h-9 px-4 py-0 text-sm"
          >
            Accedi
          </Link>
        </div>
      ) : (
        <div className="venrix-card p-4 text-sm text-slate-400">
          Non hai i permessi per rispondere in questo forum.
        </div>
      )}

      <p className="text-center text-xs text-slate-600">
        {total} {total === 1 ? "messaggio" : "messaggi"} in questa discussione
      </p>
    </div>
  );
}
