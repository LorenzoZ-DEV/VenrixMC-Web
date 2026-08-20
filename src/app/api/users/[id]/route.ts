import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { userUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { invalidateUserSessions } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const { password, ...rest } = parsed.data;

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
    },
    select: { id: true, username: true, email: true, role: true, active: true, createdAt: true },
  });

  // Role change / deactivation should invalidate any live session immediately.
  if (rest.role || rest.active === false || password) {
    await invalidateUserSessions(params.id);
  }

  await logAudit(auth.session.userId, "USER_UPDATE", `Aggiornato utente ${user.username}`);

  return NextResponse.json({ user });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  if (params.id === auth.session.userId) {
    return NextResponse.json({ error: "Non puoi eliminare il tuo stesso account" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  await prisma.user.delete({ where: { id: params.id } });
  await logAudit(auth.session.userId, "USER_DELETE", `Eliminato utente ${existing.username}`);

  return NextResponse.json({ ok: true });
}
