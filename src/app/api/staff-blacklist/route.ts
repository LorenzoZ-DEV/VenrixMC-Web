import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { staffBlacklistSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { normalizeUuid, normalizeName, normalizeDiscordId } from "@/lib/staffBlacklist";

/*
 * Blacklist candidature staff: la gestisce chi valuta le candidature, cioe'
 * Head Staff in su. Il Capo Builder ne e' fuori di proposito: vede solo le
 * candidature Builder e non deve poter escludere qualcuno dall'intero staff.
 */
const MANAGE_ROLE = Role.HEAD;

export async function GET(req: NextRequest) {
  const auth = await requireApiRole(MANAGE_ROLE);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  // La ricerca guarda i tre identificatori insieme: chi cerca ha in mano un
  // dato solo e non sa quale dei tre sia stato usato per creare la voce.
  const where = q
    ? {
        OR: [
          { minecraftName: { contains: q.toLowerCase() } },
          { minecraftUuid: { contains: q.toLowerCase().replace(/-/g, "") } },
          { discordId: { contains: q } },
        ],
      }
    : {};

  const entries = await prisma.staffBlacklist.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { createdBy: { select: { username: true } } },
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiRole(MANAGE_ROLE);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = staffBlacklistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  /*
   * Si salva sempre la forma normalizzata, mai quella digitata: e' la stessa
   * su cui il controllo in fase di candidatura fa il confronto. Se qui
   * finisse "Notch" e li' si cercasse "notch", la voce non scatterebbe mai.
   */
  const data = {
    minecraftUuid: normalizeUuid(parsed.data.minecraftUuid),
    minecraftName: normalizeName(parsed.data.minecraftName),
    discordId: normalizeDiscordId(parsed.data.discordId),
    reason: parsed.data.reason,
  };

  // Lo schema garantisce che almeno un campo sia presente, ma la
  // normalizzazione puo' scartarne uno malformato che era passato: se dopo
  // non resta niente, la voce non potrebbe combaciare con nessuno.
  if (!data.minecraftUuid && !data.minecraftName && !data.discordId) {
    return NextResponse.json(
      { error: "Nessun identificatore valido: controlla UUID, nick e ID Discord." },
      { status: 400 }
    );
  }

  const duplicate = await prisma.staffBlacklist.findFirst({
    where: {
      OR: [
        data.minecraftUuid ? { minecraftUuid: data.minecraftUuid } : null,
        data.minecraftName ? { minecraftName: data.minecraftName } : null,
        data.discordId ? { discordId: data.discordId } : null,
      ].filter((c): c is NonNullable<typeof c> => c !== null),
    },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "Esiste già una voce in blacklist per uno di questi dati." },
      { status: 409 }
    );
  }

  const entry = await prisma.staffBlacklist.create({
    data: { ...data, createdById: auth.session.userId },
    include: { createdBy: { select: { username: true } } },
  });

  await logAudit(
    auth.session.userId,
    "BLACKLIST_ADD",
    `Blacklist staff: ${[data.minecraftName, data.minecraftUuid, data.discordId]
      .filter(Boolean)
      .join(" / ")} - ${data.reason}`
  );

  return NextResponse.json({ entry }, { status: 201 });
}
