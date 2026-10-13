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
    const [pending, approved, rejected, interviewPassed, interviewRejected, withdrawn] = await Promise.all([
      prisma.staffApply.count({ where: { status: ApplyStatus.PENDING } }),
      prisma.staffApply.count({ where: { status: ApplyStatus.APPROVED } }),
      prisma.staffApply.count({ where: { status: ApplyStatus.REJECTED } }),
      prisma.staffApply.count({ where: { status: ApplyStatus.INTERVIEW_PASSED } }),
      prisma.staffApply.count({ where: { status: ApplyStatus.INTERVIEW_REJECTED } }),
      prisma.staffApply.count({ where: { status: ApplyStatus.WITHDRAWN } }),
    ]);
    // `approved` sono le scritte passate, cioe' chi aspetta l'orale.
    return { pending, approved, rejected, interviewPassed, interviewRejected, withdrawn };
  });

  return NextResponse.json(counts);
}
