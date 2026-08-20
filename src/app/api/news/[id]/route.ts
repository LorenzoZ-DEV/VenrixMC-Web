import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { newsSchema } from "@/lib/validators";
import { invalidatePrefix } from "@/lib/cache";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const news = await prisma.news.findUnique({ where: { id: params.id } });
  if (!news) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  return NextResponse.json({ news });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = newsSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  }

  const existing = await prisma.news.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const clash = await prisma.news.findUnique({ where: { slug: parsed.data.slug } });
    if (clash) return NextResponse.json({ error: "Slug già in uso" }, { status: 409 });
  }

  const news = await prisma.news.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      excerpt: parsed.data.excerpt === "" ? null : parsed.data.excerpt,
      coverImage: parsed.data.coverImage === "" ? null : parsed.data.coverImage,
    },
  });

  await invalidatePrefix("venrix:cache:news:");
  await logAudit(auth.session.userId, "NEWS_UPDATE", `Aggiornata news "${news.title}"`);

  return NextResponse.json({ news });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const existing = await prisma.news.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  await prisma.news.delete({ where: { id: params.id } });
  await invalidatePrefix("venrix:cache:news:");
  await logAudit(auth.session.userId, "NEWS_DELETE", `Eliminata news "${existing.title}"`);

  return NextResponse.json({ ok: true });
}
