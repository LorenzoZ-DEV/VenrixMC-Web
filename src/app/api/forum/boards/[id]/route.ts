import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { forumBoardUpdateSchema } from "@/lib/validators";
import { invalidateForumIndex, validateParentBoard } from "@/lib/forum";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = forumBoardUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const {
    categoryId,
    parentId,
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

  const current = await prisma.forumBoard.findUnique({
    where: { id: params.id },
    select: { id: true, categoryId: true },
  });
  if (!current) return NextResponse.json({ error: "Forum inesistente" }, { status: 404 });

  if (parentId !== undefined) {
    const check = await validateParentBoard({
      parentId,
      categoryId: categoryId ?? current.categoryId,
      boardId: current.id,
    });
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const board = await prisma.forumBoard.update({
    where: { id: params.id },
    data: {
      ...(categoryId ? { categoryId } : {}),
      // `null` e legittimo: significa "riporta al primo livello".
      ...(parentId !== undefined ? { parentId } : {}),
      ...(name ? { name } : {}),
      ...(description ? { description } : {}),
      ...(icon ? { icon } : {}),
      ...(order !== undefined ? { order } : {}),
      ...(visible !== undefined ? { visible } : {}),
      ...(locked !== undefined ? { locked } : {}),
      // `null` e un valore legittimo qui ("aperto a tutti"), quindi il test e
      // su undefined e non sulla verita del valore.
      ...(readRole !== undefined ? { readRole } : {}),
      ...(postRole !== undefined ? { postRole } : {}),
      ...(tagIds ? { tags: { set: tagIds.map((id) => ({ id })) } } : {}),
    },
  });

  await invalidateForumIndex();
  return NextResponse.json({ board });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const board = await prisma.forumBoard.findUnique({
    where: { id: params.id },
    include: { _count: { select: { topics: true, children: true } } },
  });
  if (!board) return NextResponse.json({ error: "Forum inesistente" }, { status: 404 });

  // Il vincolo sul database e ON DELETE SET NULL, quindi cancellare qui
  // promuoverebbe le figlie al primo livello senza che nessuno l'abbia
  // chiesto: meglio fermarsi e farle spostare a mano.
  if (board._count.children > 0) {
    return NextResponse.json(
      {
        error: `Questo forum contiene ${board._count.children} sotto-sezioni: spostale o eliminale prima`,
      },
      { status: 409 }
    );
  }

  // Come per le categorie: niente cancellazioni a catena non richieste. Per
  // chiudere un forum senza perdere l'archivio esistono `locked` e `visible`.
  if (board._count.topics > 0) {
    return NextResponse.json(
      {
        error: `Questo forum contiene ${board._count.topics} discussioni: spostale o nascondi il forum`,
      },
      { status: 409 }
    );
  }

  await prisma.forumBoard.delete({ where: { id: board.id } });
  await invalidateForumIndex();
  await logAudit(auth.session.userId, "FORUM_BOARD_DELETE", `Forum "${board.name}"`);

  return NextResponse.json({ ok: true });
}
