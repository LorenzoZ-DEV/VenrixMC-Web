import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const session = await getSession();
  await destroySession();
  if (session) await logAudit(session.userId, "LOGOUT");
  return NextResponse.json({ ok: true });
}
