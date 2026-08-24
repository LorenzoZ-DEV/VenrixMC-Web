import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireApiRole } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { DiscordApiError, isBotConfigured, sendChannelMessage } from "@/lib/discordBot";

const testSchema = z.object({ channelId: z.string().trim().regex(/^\d{17,20}$/, "Channel ID non valido") });

/** Posts a throwaway message so staff can verify the bot really can write there. */
export async function POST(req: NextRequest) {
  const auth = await requireApiRole(Role.DEVELOPER);
  if ("response" in auth) return auth.response;

  if (!isBotConfigured()) {
    return NextResponse.json({ error: "DISCORD_BOT_TOKEN non configurato" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  }

  try {
    await sendChannelMessage(parsed.data.channelId, {
      embeds: [
        {
          title: "Test notifiche",
          description: `Il bot di ${SITE.name} può scrivere in questo canale. Gli esiti di candidature e appeal arriveranno qui.`,
          color: 0x7c3aed,
          footer: { text: `Test inviato da ${auth.session.username}` },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  } catch (err) {
    const message =
      err instanceof DiscordApiError
        ? `Discord ha risposto ${err.status}: ${err.message}`
        : "Impossibile contattare Discord";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
