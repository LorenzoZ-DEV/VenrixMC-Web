import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { appealUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.STAFF);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = appealUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const existing = await prisma.appeal.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const appeal = await prisma.appeal.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      ...(parsed.data.status ? { reviewedById: auth.session.userId } : {}),
    },
  });

  await logAudit(
    auth.session.userId,
    "APPEAL_UPDATE",
    `Appeal ${appeal.minecraftName} → ${appeal.status}`
  );

  return NextResponse.json({ appeal });
}

// DELETE — Admin+ only, removes an appeal from the site entirely.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const existing = await prisma.appeal.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  await prisma.appeal.delete({ where: { id: params.id } });

  await logAudit(
    auth.session.userId,
    "APPEAL_DELETE",
    `Eliminato appeal di ${existing.minecraftName} (stato: ${existing.status})`
  );

  return NextResponse.json({ ok: true });
}
