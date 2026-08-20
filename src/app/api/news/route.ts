import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { newsSchema } from "@/lib/validators";
import { invalidatePrefix } from "@/lib/cache";
import { logAudit } from "@/lib/audit";

// GET — list all news (staff/admin view, includes unpublished). Public pages
// use lib/news.ts directly (cached) instead of hitting this endpoint.
export async function GET() {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const news = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { username: true } } },
  });

  return NextResponse.json({ news });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = newsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  }

  const existing = await prisma.news.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug già in uso" }, { status: 409 });
  }

  const news = await prisma.news.create({
    data: {
      ...parsed.data,
      excerpt: parsed.data.excerpt || null,
      coverImage: parsed.data.coverImage || null,
      authorId: auth.session.userId,
    },
  });

  await invalidatePrefix("venrix:cache:news:");
  await logAudit(auth.session.userId, "NEWS_CREATE", `Creata news "${news.title}"`);

  return NextResponse.json({ news }, { status: 201 });
}
