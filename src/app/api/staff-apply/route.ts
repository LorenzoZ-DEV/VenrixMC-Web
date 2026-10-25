import { NextRequest, NextResponse } from "next/server";
import { ApplyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApplicationReviewer } from "@/lib/auth";
import { staffApplySchema } from "@/lib/validators";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { withLock } from "@/lib/lock";
import { publishEvent, CHANNELS } from "@/lib/pubsub";
import { invalidatePrefix } from "@/lib/cache";
import { getSession } from "@/lib/session";
import { getApplyEligibility, formatItDate } from "@/lib/applyCooldown";
import { findBlacklistMatch } from "@/lib/staffBlacklist";
import { logAudit } from "@/lib/audit";
import { runApplyAiCheck } from "@/lib/applyAiCheck";
import { isAiDetectorConfigured } from "@/lib/aiDetector";

// GET — Head Staff+ list with filters (the Capo Builder only sees Builder ones).
export async function GET(req: NextRequest) {
  const auth = await requireApplicationReviewer();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const player = searchParams.get("player");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = 20;

  const where = {
    ...auth.scope,
    ...(status && Object.values(ApplyStatus).includes(status as ApplyStatus)
      ? { status: status as ApplyStatus }
      : {}),
    ...(player ? { minecraftName: { contains: player } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.staffApply.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reviewedBy: { select: { username: true } },
        user: { select: { username: true } },
      },
    }),
    prisma.staffApply.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    aiEnabled: isAiDetectorConfigured(),
  });
}

// POST — submission from a logged-in account (any role, MEMBER included),
// one application every 14 days across all positions, plus 3/hour per IP.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Accedi con Discord per inviare la candidatura." },
      { status: 401 }
    );
  }

  const ip = clientIp(req.headers);
  const limit = await rateLimit(ip, "staff-apply", 3, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Hai raggiunto il limite di richieste orarie. Riprova più tardi." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = staffApplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { discordId: true },
  });

  /*
   * Blacklist. E' il controllo che conta: il gate sulla pagina nasconde solo
   * il modulo, ma una POST si puo' fare a mano.
   *
   * Si confronta il nick SCRITTO NELLA CANDIDATURA, non quello sul profilo:
   * chi e' escluso proverebbe altrimenti a candidarsi indicando il nick di
   * un altro. E qui l'UUID viene risolto davvero (`resolveUuid`), perche' e'
   * il solo dato che sopravvive a un cambio di nome.
   */
  const blacklisted = await findBlacklistMatch(
    { minecraftName: parsed.data.minecraftName, discordId: user?.discordId },
    { resolveUuid: true }
  );
  if (blacklisted) {
    await logAudit(
      session.userId,
      "APPLY_BLOCKED_BLACKLIST",
      `Candidatura bloccata (match su ${blacklisted.matchedOn}) per ${parsed.data.minecraftName}: ${blacklisted.reason}`
    );
    return NextResponse.json(
      {
        error: "Candidatura bloccata per blacklist staff.",
        blacklisted: true,
        reason: blacklisted.reason,
      },
      { status: 403 }
    );
  }

  // The cooldown check lives inside the per-account lock so two tabs
  // submitting at once can't both slip past it.
  const result = await withLock(`apply:${session.userId}`, async () => {
    const eligibility = await getApplyEligibility(session.userId);
    if (!eligibility.allowed) {
      // A submission seconds after the previous one is a retry after an
      // unclear outcome, not a second application: answer as if it worked.
      if (Date.now() - eligibility.last.createdAt.getTime() < 2 * 60 * 1000) {
        return { kind: "deduped" as const, application: eligibility.last };
      }
      return { kind: "blocked" as const, nextAt: eligibility.nextAt };
    }

    const application = await prisma.staffApply.create({
      data: {
        ...parsed.data,
        ip,
        userId: session.userId,
        // Logged in through Discord: we already know where to DM the outcome.
        discordId: user?.discordId ?? null,
      },
    });

    await publishEvent(CHANNELS.NEW_APPLICATION, {
      id: application.id,
      minecraftName: application.minecraftName,
      createdAt: application.createdAt,
    });

    return { kind: "created" as const, application };
  });

  if ("locked" in result) {
    return NextResponse.json(
      { error: "Richiesta già in elaborazione, attendi qualche secondo." },
      { status: 409 }
    );
  }
  if (result.kind === "deduped") {
    return NextResponse.json({ application: result.application, deduped: true }, { status: 200 });
  }
  if (result.kind === "blocked") {
    return NextResponse.json(
      {
        error: `Candidatura già inviata. Potrai inviarne un'altra dal ${formatItDate(result.nextAt)}.`,
        nextAt: result.nextAt,
      },
      { status: 409 }
    );
  }

  await invalidatePrefix("venrix:cache:apply-counts:");

  // Senza await: il rilevatore AI puo metterci secondi e il candidato non deve
  // aspettarlo. Il server e' un processo Node sempre acceso (standalone), quindi
  // la richiesta finisce anche dopo la risposta; se fallisce, lo staff la
  // rilancia dalla dashboard.
  runApplyAiCheck(result.application.id).catch((err) => console.error("[ai-check]", err));

  return NextResponse.json({ application: result.application }, { status: 201 });
}
