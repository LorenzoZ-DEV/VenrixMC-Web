import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { forumCategoryUpdateSchema } from "@/lib/validators";
import { invalidateForumIndex } from "@/lib/forum";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = forumCategoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const { name, description, order, visible } = parsed.data;

  // Lo slug non segue il nome: e gia nei link che la gente ha salvato.
  const category = await prisma.forumCategory.update({
    where: { id: params.id },
    data: {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(order !== undefined ? { order } : {}),
      ...(visible !== undefined ? { visible } : {}),
    },
  });

  await invalidateForumIndex();
  return NextResponse.json({ category });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const category = await prisma.forumCategory.findUnique({
    where: { id: params.id },
    include: { _count: { select: { boards: true } } },
  });
  if (!category) return NextResponse.json({ error: "Categoria inesistente" }, { status: 404 });

  // Cancellare a cascata qui porterebbe via forum, discussioni e messaggi
  // senza che nessuno lo abbia chiesto: si svuota prima, a mano.
  if (category._count.boards > 0) {
    return NextResponse.json(
      { error: "Sposta o elimina prima i forum di questa categoria" },
      { status: 409 }
    );
  }

  await prisma.forumCategory.delete({ where: { id: category.id } });
  await invalidateForumIndex();
  await logAudit(auth.session.userId, "FORUM_CATEGORY_DELETE", `Categoria "${category.name}"`);

  return NextResponse.json({ ok: true });
}
