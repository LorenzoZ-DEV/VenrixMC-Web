import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { forumTagSchema } from "@/lib/validators";
import { nameSlug, uniqueSlug } from "@/lib/forumFormat";
import { FORUM_TAG_COLORS } from "@/lib/forumMeta";
import { invalidateForumIndex } from "@/lib/forum";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = forumTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const { name, color, description, order, staffOnly, boardIds } = parsed.data;

  // Il colore e una chiave di FORUM_TAG_COLORS: una chiave inventata
  // renderebbe l'etichetta senza stile invece che con uno di ripiego.
  if (!(color in FORUM_TAG_COLORS)) {
    return NextResponse.json({ error: "Colore non valido" }, { status: 400 });
  }

  const slug = await uniqueSlug(
    nameSlug(name),
    async (s) => Boolean(await prisma.forumTag.findUnique({ where: { slug: s } })),
    "etichetta"
  );

  const nextOrder =
    order ?? ((await prisma.forumTag.aggregate({ _max: { order: true } }))._max.order ?? -1) + 1;

  const tag = await prisma.forumTag.create({
    data: {
      name,
      slug,
      color,
      description: description || null,
      order: nextOrder,
      staffOnly: staffOnly ?? false,
      ...(boardIds?.length ? { boards: { connect: boardIds.map((id) => ({ id })) } } : {}),
    },
  });

  await invalidateForumIndex();
  await logAudit(auth.session.userId, "FORUM_TAG_CREATE", `Etichetta "${tag.name}"`);

  return NextResponse.json({ tag }, { status: 201 });
}
