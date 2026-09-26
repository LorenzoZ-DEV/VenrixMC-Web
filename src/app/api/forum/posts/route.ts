import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { forumPostSchema } from "@/lib/validators";
import { getForumActor, invalidateForumIndex, POSTS_PER_PAGE } from "@/lib/forum";
import { canReply } from "@/lib/forumPermissions";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// POST — risponde a una discussione.
export async function POST(req: NextRequest) {
  const actor = await getForumActor(await getSession());
  if (!actor.session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  if (actor.muted) {
    return NextResponse.json({ error: "Sei silenziato sul forum" }, { status: 403 });
  }

  const ip = clientIp(req.headers);
  const limit = await rateLimit(ip, "forum-post", 20, 60 * 10);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Stai scrivendo troppo in fretta. Aspetta qualche minuto." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = forumPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const topic = await prisma.forumTopic.findUnique({
    where: { id: parsed.data.topicId },
    include: { board: true },
  });
  if (!topic) return NextResponse.json({ error: "Discussione inesistente" }, { status: 404 });

  if (!canReply(actor.session, topic.board, topic, actor.muted)) {
    return NextResponse.json({ error: "Non puoi rispondere qui" }, { status: 403 });
  }

  const userId = actor.session.userId;
  const now = new Date();

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.forumPost.create({
      data: { topicId: topic.id, authorId: userId, content: parsed.data.content },
      select: { id: true },
    });

    // I campi denormalizzati del topic servono a ordinare e impaginare la
    // lista discussioni con una sola query: vanno tenuti allineati qui.
    await tx.forumTopic.update({
      where: { id: topic.id },
      data: {
        replyCount: { increment: 1 },
        lastPostAt: now,
        lastPostById: userId,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { postCount: { increment: 1 }, lastSeenAt: now },
    });

    return created;
  });

  await invalidateForumIndex();

  // Il messaggio appena scritto e l'ultimo: rimandiamo il chiamante
  // sull'ultima pagina, ancorato al proprio post.
  const total = topic.replyCount + 2; // apertura + risposte + questa
  const lastPage = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));

  return NextResponse.json(
    {
      post: { id: post.id },
      url: `/forum/${topic.board.slug}/${topic.slug}?page=${lastPage}#post-${post.id}`,
    },
    { status: 201 }
  );
}
