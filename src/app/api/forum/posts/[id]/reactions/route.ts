import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { forumReactionSchema } from "@/lib/validators";
import { getForumActor } from "@/lib/forum";
import { canViewBoard } from "@/lib/forumPermissions";

/**
 * POST — mette, cambia o toglie la propria reazione a un messaggio.
 * Una sola reazione per persona (unique postId+userId): premere di nuovo lo
 * stesso tasto la rimuove, premerne un altro la sostituisce.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await getForumActor(await getSession());
  if (!actor.session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  if (actor.muted) {
    return NextResponse.json({ error: "Sei silenziato sul forum" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = forumReactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Reazione non valida" }, { status: 400 });
  }

  const post = await prisma.forumPost.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true, topic: { select: { board: true } } },
  });
  if (!post) return NextResponse.json({ error: "Messaggio inesistente" }, { status: 404 });

  if (!canViewBoard(actor.session, post.topic.board)) {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
  }
  if (post.authorId === actor.session.userId) {
    return NextResponse.json({ error: "Non puoi reagire a te stesso" }, { status: 400 });
  }

  const userId = actor.session.userId;
  const existing = await prisma.forumReaction.findUnique({
    where: { postId_userId: { postId: post.id, userId } },
  });

  if (existing?.type === parsed.data.type) {
    await prisma.forumReaction.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.forumReaction.update({
      where: { id: existing.id },
      data: { type: parsed.data.type },
    });
  } else {
    await prisma.forumReaction.create({
      data: { postId: post.id, userId, type: parsed.data.type },
    });
  }

  const reactions = await prisma.forumReaction.findMany({
    where: { postId: post.id },
    select: { type: true, userId: true },
  });

  return NextResponse.json({
    counts: reactions.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1;
      return acc;
    }, {}),
    mine: reactions.find((r) => r.userId === userId)?.type ?? null,
  });
}
