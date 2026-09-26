import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis, keys } from "@/lib/redis";
import { createSession } from "@/lib/session";
import { resolveDiscordUser, discordAvatarUrl, type DiscordUser } from "@/lib/discordOAuth";
import { logAudit } from "@/lib/audit";
import { fetchDiscordRank } from "@/lib/discordRank";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

type OAuthState = { mode: "link"; userId: string } | { mode: "login"; next: string };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const failLink = (reason: string) =>
    NextResponse.redirect(new URL(`/dashboard/profile?discord=error&reason=${reason}`, APP_URL));
  // Gli errori dell'accesso tornano alla pagina di login del forum, che sa
  // tradurre `reason` in un messaggio e offrire di riprovare.
  const failLogin = (reason: string) =>
    NextResponse.redirect(new URL(`/forum/accedi?reason=${reason}`, APP_URL));

  if (!code || !state) return failLogin("missing_params");

  const stateKey = keys.oauthState(state);
  const stored = await redis.get(stateKey);
  if (!stored) return failLogin("invalid_state");
  await redis.del(stateKey); // monouso

  let parsed: OAuthState;
  try {
    parsed = JSON.parse(stored) as OAuthState;
  } catch {
    return failLogin("invalid_state");
  }

  let discordUser: DiscordUser;
  try {
    discordUser = await resolveDiscordUser(code);
  } catch {
    return parsed.mode === "link" ? failLink("exchange_failed") : failLogin("exchange_failed");
  }

  // Rank staff dai ruoli sul server Discord, riletto a ogni accesso: chi
  // perde il ruolo perde anche il badge. `undefined` = non verificabile ora,
  // quindi si lascia quello salvato invece di azzerarlo.
  const discordRank = await fetchDiscordRank(discordUser.id);
  const rankData = discordRank === undefined ? {} : { discordRank };

  // ---- Collegamento dal profilo staff ----
  if (parsed.mode === "link") {
    const clash = await prisma.user.findUnique({ where: { discordId: discordUser.id } });
    if (clash && clash.id !== parsed.userId) return failLink("already_linked");

    await prisma.user.update({
      where: { id: parsed.userId },
      data: {
        discordId: discordUser.id,
        discordUsername: discordUser.global_name ?? discordUser.username,
        discordAvatar: discordAvatarUrl(discordUser),
        ...rankData,
      },
    });

    await logAudit(
      parsed.userId,
      "PROFILE_DISCORD_LINK",
      `Account Discord collegato: ${discordUser.username}`
    );
    return NextResponse.redirect(new URL("/dashboard/profile?discord=linked", APP_URL));
  }

  // ---- Accesso/registrazione al forum ----
  const displayName = discordUser.global_name ?? discordUser.username;
  const existing = await prisma.user.findUnique({ where: { discordId: discordUser.id } });

  if (existing) {
    if (!existing.active) return failLogin("account_disabled");

    // Nome e avatar su Discord cambiano: li riallineiamo ad ogni accesso.
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        discordUsername: displayName,
        discordAvatar: discordAvatarUrl(discordUser),
        ...rankData,
        lastSeenAt: new Date(),
      },
    });

    await createSession({
      userId: existing.id,
      username: existing.username,
      role: existing.role,
    });
    return NextResponse.redirect(new URL(parsed.next, APP_URL));
  }

  const created = await prisma.user.create({
    data: {
      username: await uniqueUsername(displayName),
      // Un account Discord non ha una mail nostra: ne sintetizziamo una
      // stabile e non recapitabile solo per soddisfare l'unique della colonna.
      email: `${discordUser.id}@discord.local`,
      passwordHash: null,
      role: "MEMBER",
      discordId: discordUser.id,
      discordUsername: displayName,
      discordAvatar: discordAvatarUrl(discordUser),
      ...rankData,
      lastSeenAt: new Date(),
    },
  });

  await logAudit(created.id, "FORUM_REGISTER", `Nuovo membro via Discord: ${displayName}`);
  await createSession({ userId: created.id, username: created.username, role: created.role });

  return NextResponse.redirect(new URL(`${parsed.next}?auth=welcome`, APP_URL));
}

/**
 * Username del forum a partire dal nome Discord. Deve restare unico e
 * stampabile in un URL (/forum/utente/<username>), quindi si ripulisce e, se
 * e gia preso, si aggiunge un numero progressivo.
 */
async function uniqueUsername(displayName: string): Promise<string> {
  const base =
    displayName
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9_]/g, "")
      .slice(0, 24) || "membro";

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${attempt}`;
    const taken = await prisma.user.findUnique({ where: { username: candidate } });
    if (!taken) return candidate;
  }

  return `${base}${Date.now().toString(36)}`;
}
