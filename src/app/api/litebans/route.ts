import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireApiRole } from "@/lib/auth";
import { fetchLiteBansRecords, getBanByDisplayId, isLiteBansConfigured } from "@/lib/litebans";

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(Role.STAFF);
  if ("response" in auth) return auth.response;

  if (!isLiteBansConfigured()) {
    return NextResponse.json({ configured: false, records: [], total: 0, totalPages: 1 });
  }

  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");
  if (id) {
    const record = await getBanByDisplayId(id);
    return NextResponse.json({ configured: true, records: record ? [record] : [], total: record ? 1 : 0, totalPages: 1 });
  }

  const { records, total, totalPages } = await fetchLiteBansRecords({
    player: searchParams.get("player") ?? undefined,
    type: (searchParams.get("type") as "ban" | "mute" | "warn" | "kick" | "all" | null) ?? undefined,
    staff: searchParams.get("staff") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    page: Number(searchParams.get("page") ?? "1") || 1,
  });

  return NextResponse.json({ configured: true, records, total, totalPages });
}
