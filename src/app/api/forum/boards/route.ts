import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { forumBoardSchema } from "@/lib/validators";
import { nameSlug, uniqueSlug } from "@/lib/forumFormat";
import { invalidateForumIndex, validateParentBoard } from "@/lib/forum";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = forumBoardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const {
    categoryId,
    parentId = null,
    name,
    description,
    icon,
    order,
    visible,
    locked,
    readRole,
    postRole,
    tagIds,
  } = parsed.data;

  const category = await prisma.forumCategory.findUnique({ where: { id: categoryId } });
  if (!category) return NextResponse.json({ error: "Categoria inesistente" }, { status: 404 });

  const parentCheck = await validateParentBoard({ parentId, categoryId });
  if (!parentCheck.ok) return NextResponse.json({ error: parentCheck.error }, { status: 400 });

  const slug = await uniqueSlug(
    nameSlug(name),
    async (s) => Boolean(await prisma.forumBoard.findUnique({ where: { slug: s } })),
    "forum"
  );

  // L'ordine e relativo ai pari grado: le sotto-sezioni si numerano fra loro,
  // non insieme ai forum di primo livello della categoria.
  const nextOrder =
    order ??
    ((
      await prisma.forumBoard.aggregate({
        where: parentId ? { parentId } : { categoryId, parentId: null },
        _max: { order: true },
      })
    )._max.order ?? -1) + 1;

  const board = await prisma.forumBoard.create({
    data: {
      categoryId,
      parentId,
      name,
      slug,
      description,
      icon,
      order: nextOrder,
      visible: visible ?? true,
      locked: locked ?? false,
      readRole: readRole ?? null,
      postRole: postRole ?? null,
      ...(tagIds?.length ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
    },
  });

  await invalidateForumIndex();
  await logAudit(auth.session.userId, "FORUM_BOARD_CREATE", `Forum "${board.name}"`);

  return NextResponse.json({ board }, { status: 201 });
}
