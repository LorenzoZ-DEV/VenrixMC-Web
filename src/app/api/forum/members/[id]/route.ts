import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole, ROLE_RANK } from "@/lib/auth";
import { forumMemberUpdateSchema } from "@/lib/validators";
import { invalidateUserSessions } from "@/lib/session";
import { logAudit } from "@/lib/audit";

/**
 * PATCH — moderazione di un membro: silenziamento sul forum e disattivazione
 * dell'account. Non tocca il ruolo: quello passa da /api/users, che e
 * riservato agli ADMIN.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(Role.HEAD);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = forumMemberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Membro inesistente" }, { status: 404 });

  // Nessuno modera chi sta piu in alto di lui, e nemmeno i suoi pari grado.
  if (ROLE_RANK[target.role] >= ROLE_RANK[auth.session.role]) {
    return NextResponse.json(
      { error: "Non puoi moderare un account di pari grado o superiore" },
      { status: 403 }
    );
  }

  const { forumMuted, active } = parsed.data;

  const member = await prisma.user.update({
    where: { id: target.id },
    data: {
      ...(forumMuted !== undefined ? { forumMuted } : {}),
      ...(active !== undefined ? { active } : {}),
    },
    select: { id: true, username: true, forumMuted: true, active: true },
  });

  // Un account disattivato deve smettere di essere loggato subito, non alla
  // scadenza del cookie.
  if (active === false) await invalidateUserSessions(member.id);

  await logAudit(
    auth.session.userId,
    "FORUM_MEMBER_MODERATE",
    `${member.username}: ${member.forumMuted ? "silenziato" : "attivo"}, account ${
      member.active ? "abilitato" : "disabilitato"
    }`
  );

  return NextResponse.json({ member });
}
