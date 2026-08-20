import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { staffPositionSchema } from "@/lib/validators";
import { invalidate } from "@/lib/cache";
import { keys } from "@/lib/redis";
import { logAudit } from "@/lib/audit";

const POSITIONS_CACHE_KEY = keys.cache("staff-positions", "all");

// GET — dashboard list (Head Staff+). Public /staff-apply reads through
// lib/staffPositions.ts directly (cached) instead of this endpoint.
export async function GET() {
  const auth = await requireApiRole(Role.HEAD);
  if ("response" in auth) return auth.response;

  const positions = await prisma.staffPosition.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ positions });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(Role.HEAD);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = staffPositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  }

  const existing = await prisma.staffPosition.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug già in uso" }, { status: 409 });
  }

  const position = await prisma.staffPosition.create({ data: parsed.data });

  await invalidate(POSITIONS_CACHE_KEY);
  await logAudit(auth.session.userId, "POSITION_CREATE", `Creata posizione "${position.title}"`);

  return NextResponse.json({ position }, { status: 201 });
}
