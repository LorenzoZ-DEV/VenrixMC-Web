import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApplicationReviewer } from "@/lib/auth";
import { staffApplyUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { invalidatePrefix } from "@/lib/cache";
import { notifyApplicationDecision, describeOutcome, type NotifyOutcome } from "@/lib/discordNotify";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApplicationReviewer();
  if ("response" in auth) return auth.response;

  const application = await prisma.staffApply.findFirst({ where: { id: params.id, ...auth.scope } });
  if (!application) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  return NextResponse.json({ application });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApplicationReviewer();
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = staffApplyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const existing = await prisma.staffApply.findFirst({ where: { id: params.id, ...auth.scope } });
  if (!existing) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  // An empty discordId means "leave it as is", not "clear it".
  const { discordId: overrideId, ...updates } = parsed.data;

  const application = await prisma.staffApply.update({
    where: { id: params.id },
    data: {
      ...updates,
      ...(overrideId ? { discordId: overrideId } : {}),
      ...(updates.status ? { reviewedById: auth.session.userId } : {}),
    },
  });

  await invalidatePrefix("venrix:cache:apply-counts:");
  await logAudit(
    auth.session.userId,
    "APPLY_UPDATE",
    `Candidatura ${application.minecraftName} → ${application.status}`
  );

  // Only announce a real decision, and only when it actually changed — so a
  // double click or a note-only save doesn't DM the applicant twice.
  let notify: NotifyOutcome | null = null;
  const status = application.status;
  const decided = status === "APPROVED" || status === "REJECTED";

  if (decided && status !== existing.status) {
    notify = await notifyApplicationDecision({
      minecraftName: application.minecraftName,
      discord: application.discord,
      discordId: application.discordId,
      roles: application.roles,
      status,
      reviewerName: auth.session.username,
    });

    // Cache the snowflake we resolved so the next decision skips the search.
    if (notify.discordId && notify.discordId !== application.discordId) {
      await prisma.staffApply.update({
        where: { id: params.id },
        data: { discordId: notify.discordId },
      });
    }

    if (notify.dm !== "sent" || notify.channel === "error") {
      await logAudit(
        auth.session.userId,
        "APPLY_NOTIFY_FAILED",
        `Notifica Discord per ${application.minecraftName}: ${describeOutcome(notify)}`
      );
    }
  }

  return NextResponse.json({ application, notify });
}
