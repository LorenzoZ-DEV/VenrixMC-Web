import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/session";
import { redis, keys } from "@/lib/redis";
import { getDiscordAuthorizeUrl, isDiscordOAuthConfigured } from "@/lib/discordOAuth";

const STATE_TTL_SECONDS = 60 * 5;
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/**
 * Avvia il flusso OAuth2 di Discord. Serve due scopi diversi:
 *
 *  - `mode=link` (default per chi e gia dentro): collega Discord all'account
 *    staff corrente, dal profilo in dashboard.
 *  - `mode=login`: e la registrazione/accesso del forum. Non c'e nessun
 *    account a cui agganciarsi, quindi il callback lo crea se non esiste.
 *
 * Il token `state` porta con se la modalita e, nel caso link, l'id
 * dell'utente: e monouso (5 minuti, cancellato al ritorno) e vive in Redis,
 * cosi il callback sa cosa stava succedendo senza fidarsi della query string.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const requested = searchParams.get("mode");
  const mode = requested === "login" ? "login" : session ? "link" : "login";

  if (!isDiscordOAuthConfigured()) {
    const target =
      mode === "link"
        ? "/dashboard/profile?discord=not_configured"
        : "/forum/accedi?reason=not_configured";
    return NextResponse.redirect(new URL(target, APP_URL));
  }

  if (mode === "link" && !session) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  // Dove tornare dopo il login: solo percorsi interni, cosi il parametro non
  // si presta a rimbalzare altrove.
  const rawNext = searchParams.get("next") ?? "/forum";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/forum";

  const state = randomBytes(24).toString("hex");
  await redis.set(
    keys.oauthState(state),
    JSON.stringify(mode === "link" ? { mode, userId: session!.userId } : { mode, next }),
    "EX",
    STATE_TTL_SECONDS
  );

  return NextResponse.redirect(getDiscordAuthorizeUrl(state));
}
