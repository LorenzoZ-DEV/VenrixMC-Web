import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validators";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = await rateLimit(ip, "login", 10, 60 * 15);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Troppi tentativi di accesso. Riprova più tardi." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const { identifier, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      active: true,
      OR: [{ username: identifier }, { email: identifier }],
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
  }

  await createSession({ userId: user.id, username: user.username, role: user.role });
  await logAudit(user.id, "LOGIN", `Login da IP ${ip}`);

  return NextResponse.json({
    user: { id: user.id, username: user.username, role: user.role },
  });
}
