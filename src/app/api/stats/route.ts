import { NextResponse } from "next/server";
import { Role, AppealStatus, ApplyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { cached, TTL } from "@/lib/cache";
import { keys } from "@/lib/redis";

export async function GET() {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const stats = await cached(keys.cache("stats", "dashboard"), TTL.STATS, async () => {
    const [users, news, appealsPending, appealsTotal, appliesPending, appliesTotal] =
      await Promise.all([
        prisma.user.count(),
        prisma.news.count(),
        prisma.appeal.count({ where: { status: AppealStatus.PENDING } }),
        prisma.appeal.count(),
        prisma.staffApply.count({ where: { status: ApplyStatus.PENDING } }),
        prisma.staffApply.count(),
      ]);

    return { users, news, appealsPending, appealsTotal, appliesPending, appliesTotal };
  });

  return NextResponse.json(stats);
}
