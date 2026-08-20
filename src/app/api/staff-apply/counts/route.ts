import { NextResponse } from "next/server";
import { Role, ApplyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { cached, TTL } from "@/lib/cache";
import { keys } from "@/lib/redis";

export async function GET() {
  const auth = await requireApiRole(Role.HEAD);
  if ("response" in auth) return auth.response;

  const counts = await cached(keys.cache("apply-counts", "all"), TTL.APPLY_COUNTS, async () => {
    const [pending, approved, rejected] = await Promise.all([
      prisma.staffApply.count({ where: { status: ApplyStatus.PENDING } }),
      prisma.staffApply.count({ where: { status: ApplyStatus.APPROVED } }),
      prisma.staffApply.count({ where: { status: ApplyStatus.REJECTED } }),
    ]);
    return { pending, approved, rejected };
  });

  return NextResponse.json(counts);
}
