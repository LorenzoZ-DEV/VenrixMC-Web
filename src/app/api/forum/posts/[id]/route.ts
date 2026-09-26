import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { forumPostUpdateSchema } from "@/lib/validators";
import { getForumActor, invalidateForumIndex } from "@/lib/forum";
import { canEditPost, canDeletePost, canModerate } from "@/lib/forumPermissions";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await getForumActor(await getSession());
  if (!actor.session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = forumPostUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const post = await prisma.forumPost.findUnique({
    where: { id: params.id },
    include: { topic: { select: { id: true, locked: true, title: true } } },
  });
  if (!post) return NextResponse.json({ error: "Messaggio inesistente" }, { status: 404 });

  if (!canEditPost(actor.session, post, post.topic, actor.muted)) {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
  }

  const updated = await prisma.forumPost.update({
    where: { id: post.id },
    data: {
      content: parsed.data.content,
      // "Modificato il ... da ..." sotto al messaggio: chi legge deve sapere
      // che il testo non e piu quello originale, e se l'ha toccato lo staff.
      editedAt: new Date(),
      editedById: actor.session.userId,
    },
    select: { id: true, content: true, editedAt: true },
  });

  if (canModerate(actor.session) && post.authorId !== actor.session.userId) {
    await logAudit(
      actor.session.userId,
      "FORUM_POST_EDIT",
      `Messaggio modificato dallo staff in "${post.topic.title}"`
    );
  }

  return NextResponse.json({ post: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await getForumActor(await getSession());
  if (!actor.session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const post = await prisma.forumPost.findUnique({
    where: { id: params.id },
    include: { topic: { select: { id: true, locked: true, title: true } } },
  });
  if (!post) return NextResponse.json({ error: "Messaggio inesistente" }, { status: 404 });

  if (!canDeletePost(actor.session, post, post.topic)) {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
  }
  if (post.opening) {
    return NextResponse.json(
      { error: "Il messaggio di apertura si elimina cancellando la discussione" },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.forumPost.delete({ where: { id: post.id } });
    await tx.user.update({
      where: { id: post.authorId },
      data: { postCount: { decrement: 1 } },
    });

    // `lastPostAt`/`lastPostById` puntavano forse proprio a questo messaggio:
    // si ricalcolano dall'ultimo rimasto, altrimenti la discussione resta in
    // cima alla lista per un post che non esiste piu.
    const last = await tx.forumPost.findFirst({
      where: { topicId: post.topicId },
      orderBy: { createdAt: "desc" },
      select: { authorId: true, createdAt: true },
    });

    await tx.forumTopic.update({
      where: { id: post.topicId },
      data: {
        replyCount: { decrement: 1 },
        ...(last ? { lastPostAt: last.createdAt, lastPostById: last.authorId } : {}),
      },
    });
  });

  if (canModerate(actor.session) && post.authorId !== actor.session.userId) {
    await logAudit(
      actor.session.userId,
      "FORUM_POST_DELETE",
      `Messaggio eliminato dallo staff in "${post.topic.title}"`
    );
  }

  await invalidateForumIndex();
  return NextResponse.json({ ok: true });
}
