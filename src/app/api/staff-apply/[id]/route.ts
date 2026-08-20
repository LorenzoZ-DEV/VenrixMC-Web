import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { staffApplyUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { invalidatePrefix } from "@/lib/cache";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.HEAD);
  if ("response" in auth) return auth.response;

  const application = await prisma.staffApply.findUnique({ where: { id: params.id } });
  if (!application) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  return NextResponse.json({ application });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.HEAD);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = staffApplyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const existing = await prisma.staffApply.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  const application = await prisma.staffApply.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      ...(parsed.data.status ? { reviewedById: auth.session.userId } : {}),
    },
  });

  await invalidatePrefix("venrix:cache:apply-counts:");
  await logAudit(
    auth.session.userId,
    "APPLY_UPDATE",
    `Candidatura ${application.minecraftName} → ${application.status}`
  );

  return NextResponse.json({ application });
}
