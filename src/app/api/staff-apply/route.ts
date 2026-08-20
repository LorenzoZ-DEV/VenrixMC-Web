import { NextRequest, NextResponse } from "next/server";
import { Role, ApplyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { staffApplySchema } from "@/lib/validators";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { withLock } from "@/lib/lock";
import { publishEvent, CHANNELS } from "@/lib/pubsub";
import { invalidatePrefix } from "@/lib/cache";

// GET — Head Staff+ list with filters.
export async function GET(req: NextRequest) {
  const auth = await requireApiRole(Role.HEAD);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const player = searchParams.get("player");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = 20;

  const where = {
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
      include: { reviewedBy: { select: { username: true } } },
    }),
    prisma.staffApply.count({ where }),
  ]);

  return NextResponse.json({ items, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}

// POST — public submission, rate-limited 3/hour per IP.
export async function POST(req: NextRequest) {
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

  const result = await withLock(`apply:${ip}:${parsed.data.minecraftName.toLowerCase()}`, async () => {
    const application = await prisma.staffApply.create({
      data: { ...parsed.data, ip },
    });

    await publishEvent(CHANNELS.NEW_APPLICATION, {
      id: application.id,
      minecraftName: application.minecraftName,
      createdAt: application.createdAt,
    });

    return application;
  });

  if ("locked" in result) {
    return NextResponse.json(
      { error: "Richiesta già in elaborazione, attendi qualche secondo." },
      { status: 409 }
    );
  }

  await invalidatePrefix("venrix:cache:apply-counts:");

  return NextResponse.json({ application: result }, { status: 201 });
}
