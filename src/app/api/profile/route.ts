import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, createSession, patchCurrentSession, invalidateUserSessions } from "@/lib/session";
import { profileUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      discordId: true,
      discordUsername: true,
      discordAvatar: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  return NextResponse.json({ user });
}

// PATCH — self-service profile update. Any logged-in user can change their
// own username/email/password, gated behind re-entering the current
// password (basic reauth, since the session cookie alone shouldn't be
// enough to take over an account's credentials).
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  // Gli account nati sul forum con Discord non hanno una password: questa
  // riautenticazione non si puo fare e con essa nemmeno il cambio credenziali.
  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "Questo account accede con Discord e non ha una password" },
      { status: 400 }
    );
  }

  const passwordOk = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ error: "Password attuale errata" }, { status: 401 });
  }

  const { username, email, newPassword } = parsed.data;

  if (username && username !== user.username) {
    const clash = await prisma.user.findUnique({ where: { username } });
    if (clash) return NextResponse.json({ error: "Username già in uso" }, { status: 409 });
  }
  if (email && email !== user.email) {
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash) return NextResponse.json({ error: "Email già in uso" }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(username ? { username } : {}),
      ...(email ? { email } : {}),
      ...(newPassword ? { passwordHash: await bcrypt.hash(newPassword, 12) } : {}),
    },
    select: { id: true, username: true, email: true, role: true },
  });

  await logAudit(user.id, "PROFILE_UPDATE", "Profilo aggiornato dall'utente stesso");

  if (newPassword) {
    // Rotate credentials: kill every existing session (this device
    // included) and issue a brand-new one, so other devices are signed out
    // while the device that just changed the password stays logged in.
    await invalidateUserSessions(user.id);
    await createSession({ userId: updated.id, username: updated.username, role: updated.role });
  } else if (username) {
    await patchCurrentSession({ username: updated.username });
  }

  return NextResponse.json({ user: updated });
}
