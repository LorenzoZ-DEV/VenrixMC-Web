import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { forumProfileSchema } from "@/lib/validators";
import { checkMinecraftNick } from "@/lib/forum";

/**
 * PATCH — profilo pubblico del forum (nick Minecraft, bio, firma).
 * Non tocca username, email o password: quelle passano da /api/profile, che
 * chiede la password attuale. Qui basta la sessione perche nessuno di questi
 * campi puo servire a prendere il controllo dell'account.
 */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = forumProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }

  const { minecraftName, bio, signature } = parsed.data;

  // Il nick decide il badge di rank (vetrina /staff): non si puo prendere
  // quello di un altro account ne quello di uno staffer se non lo si e.
  if (minecraftName) {
    const me = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, discordRank: true },
    });
    if (!me) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

    const problem = await checkMinecraftNick(session.userId, minecraftName, me);
    if (problem) return NextResponse.json({ error: problem }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      // Stringa vuota dal form = "svuota il campo", non "lascia com'e".
      ...(minecraftName !== undefined ? { minecraftName: minecraftName || null } : {}),
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(signature !== undefined ? { signature: signature || null } : {}),
      lastSeenAt: new Date(),
    },
    select: { username: true, minecraftName: true, bio: true, signature: true },
  });

  return NextResponse.json({ user });
}
