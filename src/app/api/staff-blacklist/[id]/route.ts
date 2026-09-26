import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const MANAGE_ROLE = Role.HEAD;

/** Rimuove una voce: da quel momento la persona puo' candidarsi di nuovo. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(MANAGE_ROLE);
  if ("response" in auth) return auth.response;

  const entry = await prisma.staffBlacklist.findUnique({ where: { id: params.id } });
  if (!entry) {
    return NextResponse.json({ error: "Voce non trovata" }, { status: 404 });
  }

  await prisma.staffBlacklist.delete({ where: { id: params.id } });

  await logAudit(
    auth.session.userId,
    "BLACKLIST_REMOVE",
    `Rimosso dalla blacklist staff: ${[entry.minecraftName, entry.minecraftUuid, entry.discordId]
      .filter(Boolean)
      .join(" / ")}`
  );

  return NextResponse.json({ ok: true });
}
