import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.userId },
    data: { discordId: null, discordUsername: null, discordAvatar: null },
  });

  await logAudit(session.userId, "PROFILE_DISCORD_UNLINK", "Account Discord scollegato");

  return NextResponse.json({ ok: true });
}
