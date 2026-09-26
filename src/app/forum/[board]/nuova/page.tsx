import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getBoardBySlug, getBoardTags, getForumActor } from "@/lib/forum";
import { canViewBoard, canCreateTopic, canModerate } from "@/lib/forumPermissions";
import { NewTopicForm } from "@/components/forum/NewTopicForm";
import { IconChevronRight } from "@/components/icons";

export const metadata: Metadata = { title: "Nuova discussione · Forum VenrixMC" };
export const dynamic = "force-dynamic";

export default async function NewTopicPage({ params }: { params: { board: string } }) {
  const session = await getSession();
  const board = await getBoardBySlug(params.board);
  if (!board || !canViewBoard(session, board)) notFound();

  if (!session) redirect(`/forum/accedi?next=/forum/${board.slug}/nuova`);

  const actor = await getForumActor(session);
  const allowed = canCreateTopic(actor.session, board, actor.muted);

  const tags = await getBoardTags(board.id, canModerate(session));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/forum" className="hover:text-venrix-300">
          Forum
        </Link>
        <IconChevronRight className="h-3 w-3" />
        <Link href={`/forum/${board.slug}`} className="hover:text-venrix-300">
          {board.name}
        </Link>
        <IconChevronRight className="h-3 w-3" />
        <span className="text-slate-300">Nuova discussione</span>
      </nav>

      <h1 className="font-display text-xl font-bold text-white">Nuova discussione</h1>

      {allowed ? (
        <NewTopicForm boardId={board.id} boardName={board.name} tags={tags} />
      ) : (
        <div className="venrix-card p-6 text-sm text-slate-400">
          {actor.muted
            ? "Sei silenziato sul forum e non puoi aprire discussioni."
            : "Non hai i permessi per aprire discussioni in questo forum."}
        </div>
      )}
    </div>
  );
}
