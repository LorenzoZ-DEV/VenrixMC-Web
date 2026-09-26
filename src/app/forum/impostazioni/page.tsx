import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ForumProfileForm } from "@/components/forum/ForumProfileForm";
import { LogoutButton } from "@/components/forum/LogoutButton";
import { IconUser } from "@/components/icons";

export const metadata: Metadata = { title: "Il tuo profilo · Forum VenrixMC" };
export const dynamic = "force-dynamic";

export default async function ForumSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/forum/accedi?next=/forum/impostazioni");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      username: true,
      minecraftName: true,
      bio: true,
      signature: true,
      discordUsername: true,
      forumMuted: true,
    },
  });
  if (!user) redirect("/forum/accedi");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Il tuo profilo</h1>
          <p className="mt-1 text-sm text-slate-400">
            Come ti vedono gli altri membri del forum.
          </p>
        </div>
        <Link
          href={`/forum/utente/${user.username}`}
          className="pixel-corners-sm inline-flex items-center gap-1.5 border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-venrix-500/40"
        >
          <IconUser className="h-4 w-4" />
          Vedi profilo
        </Link>
      </header>

      {user.forumMuted && (
        <div className="pixel-corners border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Sei stato silenziato dallo staff: puoi leggere il forum ma non scrivere.
        </div>
      )}

      <div className="venrix-card flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-white">{user.username}</p>
          <p className="text-xs text-slate-500">
            {user.discordUsername
              ? `Collegato a Discord come ${user.discordUsername}`
              : "Account senza Discord collegato"}
          </p>
        </div>
        <LogoutButton />
      </div>

      <ForumProfileForm profile={user} />
    </div>
  );
}
