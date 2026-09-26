import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { staffMemberUpdateSchema } from "@/lib/validators";
import { invalidate } from "@/lib/cache";
import { logAudit } from "@/lib/audit";
import { STAFF_MEMBERS_CACHE_KEY } from "@/lib/staffMembers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = staffMemberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const existing = await prisma.staffMember.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Membro non trovato" }, { status: 404 });

  if (parsed.data.username && parsed.data.username !== existing.username) {
    const clash = await prisma.staffMember.findUnique({
      where: { username: parsed.data.username },
    });
    if (clash) {
      return NextResponse.json({ error: "Questo membro è già in lista" }, { status: 409 });
    }
  }

  const member = await prisma.staffMember.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await invalidate(STAFF_MEMBERS_CACHE_KEY);
  await logAudit(
    auth.session.userId,
    "STAFF_MEMBER_UPDATE",
    `Aggiornato ${member.username} (${member.role}, ${member.visible ? "visibile" : "nascosto"})`
  );

  return NextResponse.json({ member });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const existing = await prisma.staffMember.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Membro non trovato" }, { status: 404 });

  await prisma.staffMember.delete({ where: { id: params.id } });

  await invalidate(STAFF_MEMBERS_CACHE_KEY);
  await logAudit(
    auth.session.userId,
    "STAFF_MEMBER_DELETE",
    `Rimosso ${existing.username} dallo staff`
  );

  return NextResponse.json({ ok: true });
}
