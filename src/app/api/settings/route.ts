import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { settingsUpdateSchema } from "@/lib/validators";
import { invalidate } from "@/lib/cache";
import { keys } from "@/lib/redis";
import { logAudit } from "@/lib/audit";

// Generic key/value settings store (site colors, CTA text, social links,
// toggles for public sections, ...) — used by the Developer live-edit panel.
export async function GET() {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const settings = await prisma.siteSettings.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const auth = await requireApiRole(Role.DEVELOPER);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const setting = await prisma.siteSettings.upsert({
    where: { key: parsed.data.key },
    update: { value: parsed.data.value },
    create: { key: parsed.data.key, value: parsed.data.value },
  });

  await invalidate(keys.cache("settings", parsed.data.key));
  await logAudit(auth.session.userId, "SETTINGS_UPDATE", `Impostazione "${parsed.data.key}" aggiornata`);

  return NextResponse.json({ setting });
}
