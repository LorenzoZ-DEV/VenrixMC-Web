import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { forumTopicSchema } from "@/lib/validators";
import { topicSlug } from "@/lib/forumFormat";
import { getForumActor, invalidateForumIndex, allowedTagIds } from "@/lib/forum";
import { canCreateTopic, canModerate } from "@/lib/forumPermissions";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// POST — apre una discussione. Discussione e primo messaggio nascono insieme
// in una transazione: un topic senza messaggio di apertura non ha senso e
// romperebbe ogni pagina che lo mostra.
export async function POST(req: NextRequest) {
  const actor = await getForumActor(await getSession());
  if (!actor.session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  if (actor.muted) {
    return NextResponse.json({ error: "Sei silenziato sul forum" }, { status: 403 });
  }

  const ip = clientIp(req.headers);
  const limit = await rateLimit(ip, "forum-topic", 5, 60 * 10);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Stai aprendo troppe discussioni. Aspetta qualche minuto." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = forumTopicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const { boardId, title, content, tagIds = [] } = parsed.data;

  const board = await prisma.forumBoard.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Forum inesistente" }, { status: 404 });

  if (!canCreateTopic(actor.session, board, actor.muted)) {
    return NextResponse.json(
      { error: "Non puoi aprire discussioni in questo forum" },
      { status: 403 }
    );
  }

  const tags = await allowedTagIds(tagIds, boardId, canModerate(actor.session));

  const topic = await prisma.$transaction(async (tx) => {
    const created = await tx.forumTopic.create({
      data: {
        boardId,
        authorId: actor.session!.userId,
        title,
        slug: topicSlug(title),
        lastPostAt: new Date(),
        lastPostById: actor.session!.userId,
        tags: tags.length ? { connect: tags.map((id) => ({ id })) } : undefined,
      },
      select: { id: true, slug: true },
    });

    await tx.forumPost.create({
      data: { topicId: created.id, authorId: actor.session!.userId, content, opening: true },
    });

    await tx.user.update({
      where: { id: actor.session!.userId },
      data: { postCount: { increment: 1 }, lastSeenAt: new Date() },
    });

    return created;
  });

  await invalidateForumIndex();

  return NextResponse.json(
    { topic: { slug: topic.slug, url: `/forum/${board.slug}/${topic.slug}` } },
    { status: 201 }
  );
}
