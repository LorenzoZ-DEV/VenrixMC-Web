import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { forumTagUpdateSchema } from "@/lib/validators";
import { FORUM_TAG_COLORS } from "@/lib/forumMeta";
import { invalidateForumIndex } from "@/lib/forum";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = forumTagUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const { name, color, description, order, staffOnly, boardIds } = parsed.data;

  if (color && !(color in FORUM_TAG_COLORS)) {
    return NextResponse.json({ error: "Colore non valido" }, { status: 400 });
  }

  const tag = await prisma.forumTag.update({
    where: { id: params.id },
    data: {
      ...(name ? { name } : {}),
      ...(color ? { color } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(order !== undefined ? { order } : {}),
      ...(staffOnly !== undefined ? { staffOnly } : {}),
      // Lista vuota = etichetta globale, disponibile in ogni forum.
      ...(boardIds ? { boards: { set: boardIds.map((id) => ({ id })) } } : {}),
    },
  });

  await invalidateForumIndex();
  return NextResponse.json({ tag });
}

// DELETE — l'etichetta sparisce dalle discussioni che la portavano (la
// relazione e una tabella ponte), ma le discussioni restano.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const tag = await prisma.forumTag.findUnique({ where: { id: params.id } });
  if (!tag) return NextResponse.json({ error: "Etichetta inesistente" }, { status: 404 });

  await prisma.forumTag.delete({ where: { id: tag.id } });
  await invalidateForumIndex();
  await logAudit(auth.session.userId, "FORUM_TAG_DELETE", `Etichetta "${tag.name}"`);

  return NextResponse.json({ ok: true });
}
