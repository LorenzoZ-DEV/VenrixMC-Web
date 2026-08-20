import { NextRequest, NextResponse } from "next/server";
import { Role, AppealStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { appealSchema } from "@/lib/validators";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { withLock } from "@/lib/lock";
import { publishEvent, CHANNELS } from "@/lib/pubsub";

// GET — staff-only list with filters (status, player, date range).
export async function GET(req: NextRequest) {
  const auth = await requireApiRole(Role.STAFF);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const player = searchParams.get("player");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = 20;

  const where = {
    ...(status && Object.values(AppealStatus).includes(status as AppealStatus)
      ? { status: status as AppealStatus }
      : {}),
    ...(player ? { minecraftName: { contains: player } } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.appeal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { reviewedBy: { select: { username: true } } },
    }),
    prisma.appeal.count({ where }),
  ]);

  return NextResponse.json({ items, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}

// POST — public submission, rate-limited 3/hour per IP, guarded by a
// distributed lock keyed on IP+player to avoid accidental double submits.
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = await rateLimit(ip, "appeals", 3, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Hai raggiunto il limite di richieste orarie. Riprova più tardi." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = appealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  }

  const result = await withLock(`appeal:${ip}:${parsed.data.minecraftName.toLowerCase()}`, async () => {
    const appeal = await prisma.appeal.create({
      data: {
        minecraftName: parsed.data.minecraftName,
        uuid: parsed.data.uuid || null,
        banId: parsed.data.banId || null,
        banReason: parsed.data.banReason || null,
        message: parsed.data.message,
        ip,
      },
    });

    await publishEvent(CHANNELS.NEW_APPEAL, {
      id: appeal.id,
      minecraftName: appeal.minecraftName,
      createdAt: appeal.createdAt,
    });

    return appeal;
  });

  if ("locked" in result) {
    return NextResponse.json(
      { error: "Richiesta già in elaborazione, attendi qualche secondo." },
      { status: 409 }
    );
  }

  return NextResponse.json({ appeal: result }, { status: 201 });
}
