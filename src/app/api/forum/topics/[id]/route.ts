import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { forumTopicUpdateSchema } from "@/lib/validators";
import { getForumActor, invalidateForumIndex, allowedTagIds } from "@/lib/forum";
import { canModerate } from "@/lib/forumPermissions";
import { logAudit } from "@/lib/audit";

// PATCH — due livelli di permesso nella stessa rotta:
//  - l'autore puo correggere il titolo ed etichettare la propria discussione,
//    finche non e chiusa;
//  - lo staff puo anche fissarla in cima, chiuderla o spostarla di forum.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await getForumActor(await getSession());
  if (!actor.session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = forumTopicUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const topic = await prisma.forumTopic.findUnique({
    where: { id: params.id },
    include: {
      board: { select: { id: true, slug: true } },
      tags: { select: { id: true, staffOnly: true } },
    },
  });
  if (!topic) return NextResponse.json({ error: "Discussione inesistente" }, { status: 404 });

  const moderator = canModerate(actor.session);
  const owner = topic.authorId === actor.session.userId;

  const { title, pinned, locked, boardId, tagIds } = parsed.data;

  if (!moderator) {
    if (!owner || actor.muted || topic.locked) {
      return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
    }
    if (pinned !== undefined || locked !== undefined || boardId !== undefined) {
      return NextResponse.json(
        { error: "Solo lo staff può fissare, chiudere o spostare una discussione" },
        { status: 403 }
      );
    }
  }

  // Le etichette vanno rivalidate contro il forum di destinazione, non contro
  // quello di partenza, se la discussione sta cambiando casa.
  const targetBoardId = boardId ?? topic.boardId;
  if (boardId && boardId !== topic.boardId) {
    const target = await prisma.forumBoard.findUnique({ where: { id: boardId } });
    if (!target) return NextResponse.json({ error: "Forum inesistente" }, { status: 404 });
  }

  // Quando l'autore ritocca le etichette, quelle riservate messe dallo staff
  // (Accettato, Rifiutato...) restano: non puo ne toglierle ne aggiungerle.
  let nextTagIds: string[] | undefined;
  if (tagIds) {
    nextTagIds = await allowedTagIds(tagIds, targetBoardId, moderator);
    if (!moderator) {
      const kept = topic.tags.filter((t) => t.staffOnly).map((t) => t.id);
      nextTagIds = Array.from(new Set([...kept, ...nextTagIds]));
    }
  }

  const updated = await prisma.forumTopic.update({
    where: { id: topic.id },
    data: {
      ...(title ? { title } : {}),
      ...(pinned !== undefined ? { pinned } : {}),
      ...(locked !== undefined ? { locked } : {}),
      ...(boardId ? { boardId } : {}),
      ...(nextTagIds ? { tags: { set: nextTagIds.map((id) => ({ id })) } } : {}),
    },
    include: { board: { select: { slug: true } } },
  });

  if (moderator && !owner) {
    await logAudit(
      actor.session.userId,
      "FORUM_TOPIC_MODERATE",
      `Discussione "${topic.title}" aggiornata dallo staff`
    );
  }

  await invalidateForumIndex();

  return NextResponse.json({
    topic: { slug: updated.slug, url: `/forum/${updated.board.slug}/${updated.slug}` },
  });
}

// DELETE — cancella la discussione con tutti i suoi messaggi (cascade). Solo
// staff: un autore che vuole sparire chiede, cosi non si perdono le risposte
// di chi gli ha risposto in buona fede.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!canModerate(session)) {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
  }

  const topic = await prisma.forumTopic.findUnique({
    where: { id: params.id },
    include: { board: { select: { slug: true } }, _count: { select: { posts: true } } },
  });
  if (!topic) return NextResponse.json({ error: "Discussione inesistente" }, { status: 404 });

  // I contatori per autore vanno rimessi a posto prima della cancellazione:
  // dopo, i post non ci sono piu e non si sa piu a chi scalarli.
  const byAuthor = await prisma.forumPost.groupBy({
    by: ["authorId"],
    where: { topicId: topic.id },
    _count: { _all: true },
  });

  await prisma.$transaction([
    ...byAuthor.map((row) =>
      prisma.user.update({
        where: { id: row.authorId },
        data: { postCount: { decrement: row._count._all } },
      })
    ),
    prisma.forumTopic.delete({ where: { id: topic.id } }),
  ]);

  await logAudit(
    session!.userId,
    "FORUM_TOPIC_DELETE",
    `Discussione "${topic.title}" eliminata (${topic._count.posts} messaggi)`
  );
  await invalidateForumIndex();

  return NextResponse.json({ ok: true, board: `/forum/${topic.board.slug}` });
}
