import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApplicationReviewer } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * Eccezione al limite di una candidatura ogni 14 giorni: da adesso il
 * candidato puo inviarne subito un'altra. Le candidature precedenti restano
 * dove sono, smettono solo di contare per il limite.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApplicationReviewer();
  if ("response" in auth) return auth.response;

  const application = await prisma.staffApply.findFirst({
    where: { id: params.id, ...auth.scope },
    select: { userId: true, minecraftName: true },
  });
  if (!application) return NextResponse.json({ error: "Non trovata" }, { status: 404 });
  if (!application.userId) {
    return NextResponse.json(
      { error: "Questa candidatura non è collegata a un account: non ha limiti da rimuovere." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: application.userId },
    data: { applyCooldownResetAt: new Date() },
  });

  await logAudit(
    auth.session.userId,
    "APPLY_COOLDOWN_RESET",
    `Limite candidature rimosso per ${application.minecraftName}`
  );

  return NextResponse.json({ ok: true });
}
