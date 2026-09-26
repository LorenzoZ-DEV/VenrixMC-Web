import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { staffMemberSchema } from "@/lib/validators";
import { invalidate } from "@/lib/cache";
import { logAudit } from "@/lib/audit";
import { STAFF_MEMBERS_CACHE_KEY } from "@/lib/staffMembers";

// GET — elenco per la dashboard, membri nascosti compresi. La pagina
// pubblica /staff non passa di qui: legge da lib/staffMembers.ts, che filtra
// i nascosti e sfrutta la cache.
export async function GET() {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const members = await prisma.staffMember.findMany({
    orderBy: [{ order: "asc" }, { username: "asc" }],
  });
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = staffMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const existing = await prisma.staffMember.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) {
    return NextResponse.json({ error: "Questo membro è già in lista" }, { status: 409 });
  }

  // Senza una posizione esplicita il nuovo membro va in coda al suo ruolo,
  // cosi aggiungerne uno non riordina le schede gia pubblicate.
  const order =
    parsed.data.order ??
    ((
      await prisma.staffMember.aggregate({
        where: { role: parsed.data.role },
        _max: { order: true },
      })
    )._max.order ?? -1) + 1;

  const member = await prisma.staffMember.create({
    data: { ...parsed.data, order },
  });

  await invalidate(STAFF_MEMBERS_CACHE_KEY);
  await logAudit(
    auth.session.userId,
    "STAFF_MEMBER_CREATE",
    `Aggiunto ${member.username} allo staff come ${member.role}`
  );

  return NextResponse.json({ member }, { status: 201 });
}
