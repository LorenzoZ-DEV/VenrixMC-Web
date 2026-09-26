import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { forumCategorySchema } from "@/lib/validators";
import { nameSlug, uniqueSlug } from "@/lib/forumFormat";
import { invalidateForumIndex } from "@/lib/forum";
import { logAudit } from "@/lib/audit";

// GET — struttura completa per il pannello dashboard: categorie, forum ed
// etichette, nascosti compresi. La pagina pubblica non passa di qui.
export async function GET() {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const [categories, tags] = await Promise.all([
    prisma.forumCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        boards: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
          include: {
            tags: { select: { id: true } },
            _count: { select: { topics: true } },
          },
        },
      },
    }),
    prisma.forumTag.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { boards: { select: { id: true } }, _count: { select: { topics: true } } },
    }),
  ]);

  return NextResponse.json({ categories, tags });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = forumCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const slug = await uniqueSlug(
    nameSlug(parsed.data.name),
    async (s) => Boolean(await prisma.forumCategory.findUnique({ where: { slug: s } })),
    "categoria"
  );

  // Senza una posizione esplicita la categoria va in fondo, cosi aggiungerne
  // una non rimescola quelle gia pubblicate.
  const order =
    parsed.data.order ??
    ((await prisma.forumCategory.aggregate({ _max: { order: true } }))._max.order ?? -1) + 1;

  const category = await prisma.forumCategory.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      order,
      visible: parsed.data.visible ?? true,
    },
  });

  await invalidateForumIndex();
  await logAudit(auth.session.userId, "FORUM_CATEGORY_CREATE", `Categoria "${category.name}"`);

  return NextResponse.json({ category }, { status: 201 });
}
