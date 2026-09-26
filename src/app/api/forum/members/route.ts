import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";

// GET — elenco membri per il pannello di moderazione. `q` filtra per nome.
export async function GET(req: NextRequest) {
  const auth = await requireApiRole(Role.HEAD);
  if ("response" in auth) return auth.response;

  const query = new URL(req.url).searchParams.get("q")?.trim();

  const members = await prisma.user.findMany({
    where: query ? { username: { contains: query } } : {},
    orderBy: [{ postCount: "desc" }, { createdAt: "asc" }],
    take: 100,
    select: {
      id: true,
      username: true,
      role: true,
      discordRank: true,
      active: true,
      forumMuted: true,
      postCount: true,
      minecraftName: true,
      discordUsername: true,
      discordAvatar: true,
      createdAt: true,
      lastSeenAt: true,
    },
  });

  return NextResponse.json({ members });
}
