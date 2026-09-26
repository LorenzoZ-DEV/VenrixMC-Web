import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { z } from "zod";
import { invalidate } from "@/lib/cache";
import { keys } from "@/lib/redis";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  content: z.string().min(1).max(50_000),
  format: z.enum(["html", "markdown", "text"]).optional().default("html"),
});

export async function PUT(req: NextRequest) {
  const auth = await requireApiRole(Role.ADMIN);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Contenuto non valido" }, { status: 400 });
  }

  await prisma.siteSettings.upsert({
    where: { key: "rules_content" },
    update: { value: parsed.data.content },
    create: { key: "rules_content", value: parsed.data.content },
  });
  await prisma.siteSettings.upsert({
    where: { key: "rules_format" },
    update: { value: parsed.data.format },
    create: { key: "rules_format", value: parsed.data.format },
  });

  await invalidate(keys.cache("settings", "rules_content"));
  await invalidate(keys.cache("settings", "rules_format"));
  await logAudit(auth.session.userId, "RULES_UPDATE", `Regolamento aggiornato (formato: ${parsed.data.format})`);

  return NextResponse.json({ ok: true });
}
