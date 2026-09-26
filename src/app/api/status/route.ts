import { NextRequest, NextResponse } from "next/server";
import { getNetworkStatus } from "@/lib/siteStatus";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// GET — stato pubblico del network: annuncio + modalità con ping live.
// Cache Redis 30s dentro getNetworkStatus, rate limit generoso da pagina.
export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = await rateLimit(ip, "status", 120, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Troppe richieste, riprova tra poco." },
      { status: 429 }
    );
  }

  const status = await getNetworkStatus();
  return NextResponse.json({
    announcement: status.announcement,
    // Il totale lo calcola il server: se lo ricavasse il client sommando
    // `modes`, ricadrebbe nel doppio conteggio proxy + backend.
    totals: status.totals,
    // Solo il necessario alla UI pubblica: niente host/porte dei backend.
    modes: status.modes.map((m) => ({
      name: m.name,
      online: m.online,
      playersOnline: m.playersOnline,
      playersMax: m.playersMax,
      manual: m.manual,
    })),
    updatedAt: new Date().toISOString(),
  });
}
