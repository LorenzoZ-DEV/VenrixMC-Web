import { NextRequest, NextResponse } from "next/server";
import {
  fetchLiteBansRecords,
  formatBanDisplayId,
  isLiteBansConfigured,
  type LiteBansType,
} from "@/lib/litebans";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const PAGE_SIZE = 20;
const ALLOWED_TYPES = ["ban", "mute", "warn", "kick", "all"] as const;

// GET — lista pubblica delle sanzioni (ban, mute, warn, kick).
// Pensata per la pagina /bans: nessun login richiesto, ma niente filtri
// sensibili (solo giocatore + tipo), pageSize fissa e rate limit generoso
// perche e una pagina da sfogliare, non un form.
export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = await rateLimit(ip, "bans", 120, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Troppe richieste, riprova tra poco." },
      { status: 429 }
    );
  }

  if (!isLiteBansConfigured()) {
    return NextResponse.json({ configured: false, records: [], total: 0, totalPages: 1 });
  }

  const { searchParams } = new URL(req.url);
  const rawType = searchParams.get("type") ?? "all";
  const type = (ALLOWED_TYPES as readonly string[]).includes(rawType)
    ? (rawType as LiteBansType | "all")
    : "all";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const player = searchParams.get("player") ?? undefined;

  // Lista + conteggi per tab in parallelo (tutto cachato 60s in Redis).
  const [main, banTotal, muteTotal, warnTotal, kickTotal] = await Promise.all([
    fetchLiteBansRecords({ player, type, page, pageSize: PAGE_SIZE }),
    ...(["ban", "mute", "warn", "kick"] as const).map((t) =>
      fetchLiteBansRecords({ player, type: t, page: 1, pageSize: 1 }).then((r) => r.total)
    ),
  ]);

  const { records, total, totalPages } = main;
  const counts = {
    all: banTotal + muteTotal + warnTotal + kickTotal,
    ban: banTotal,
    mute: muteTotal,
    warn: warnTotal,
    kick: kickTotal,
  };

  return NextResponse.json({
    configured: true,
    records: records.map((r) => ({
      ...r,
      displayId: r.type === "ban" ? formatBanDisplayId(r.id) : null,
    })),
    total,
    totalPages,
    counts,
  });
}
