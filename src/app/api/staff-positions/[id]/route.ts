import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { staffPositionUpdateSchema } from "@/lib/validators";
import { invalidate } from "@/lib/cache";
import { keys } from "@/lib/redis";
import { logAudit } from "@/lib/audit";

const POSITIONS_CACHE_KEY = keys.cache("staff-positions", "all");

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.HEAD);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = staffPositionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  }

  const existing = await prisma.staffPosition.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const clash = await prisma.staffPosition.findUnique({ where: { slug: parsed.data.slug } });
    if (clash) return NextResponse.json({ error: "Slug già in uso" }, { status: 409 });
  }

  const position = await prisma.staffPosition.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await invalidate(POSITIONS_CACHE_KEY);
  await logAudit(
    auth.session.userId,
    "POSITION_UPDATE",
    `Posizione "${position.title}" aggiornata (${position.open ? "aperta" : "chiusa"}, ${position.slots} posti)`
  );

  return NextResponse.json({ position });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.HEAD);
  if ("response" in auth) return auth.response;

  const existing = await prisma.staffPosition.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  await prisma.staffPosition.delete({ where: { id: params.id } });

  await invalidate(POSITIONS_CACHE_KEY);
  await logAudit(auth.session.userId, "POSITION_DELETE", `Eliminata posizione "${existing.title}"`);

  return NextResponse.json({ ok: true });
}
