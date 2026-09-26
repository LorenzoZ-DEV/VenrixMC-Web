import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { userCreateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      discordRank: true,
      active: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  }

  const clash = await prisma.user.findFirst({
    where: { OR: [{ username: parsed.data.username }, { email: parsed.data.email }] },
  });
  if (clash) return NextResponse.json({ error: "Username o email già in uso" }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash,
    },
    select: { id: true, username: true, email: true, role: true, discordRank: true, active: true, createdAt: true },
  });

  await logAudit(auth.session.userId, "USER_CREATE", `Creato utente ${user.username} (${user.role})`);

  return NextResponse.json({ user }, { status: 201 });
}
