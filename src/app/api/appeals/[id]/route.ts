import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { appealUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { notifyAppealDecision, describeOutcome, type NotifyOutcome } from "@/lib/discordNotify";

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

  // An empty discordId means "leave it as is", not "clear it".
  const { discordId: overrideId, ...updates } = parsed.data;

  const appeal = await prisma.appeal.update({
    where: { id: params.id },
    data: {
      ...updates,
      ...(overrideId ? { discordId: overrideId } : {}),
      ...(updates.status ? { reviewedById: auth.session.userId } : {}),
    },
  });

  await logAudit(
    auth.session.userId,
    "APPEAL_UPDATE",
    `Appeal ${appeal.minecraftName} → ${appeal.status}`
  );

  // Only announce a real decision, and only when it actually changed — saving
  // staff notes on an already-decided appeal must not re-DM the player.
  let notify: NotifyOutcome | null = null;
  const status = appeal.status;
  const decided = status === "APPROVED" || status === "DENIED";

  if (decided && status !== existing.status) {
    notify = await notifyAppealDecision({
      minecraftName: appeal.minecraftName,
      discord: appeal.discord,
      discordId: appeal.discordId,
      banId: appeal.banId,
      staffNotes: appeal.staffNotes,
      status,
      reviewerName: auth.session.username,
    });

    if (notify.discordId && notify.discordId !== appeal.discordId) {
      await prisma.appeal.update({
        where: { id: params.id },
        data: { discordId: notify.discordId },
      });
    }

    if (notify.dm !== "sent" || notify.channel === "error") {
      await logAudit(
        auth.session.userId,
        "APPEAL_NOTIFY_FAILED",
        `Notifica Discord per ${appeal.minecraftName}: ${describeOutcome(notify)}`
      );
    }
  }

  return NextResponse.json({ appeal, notify });
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
