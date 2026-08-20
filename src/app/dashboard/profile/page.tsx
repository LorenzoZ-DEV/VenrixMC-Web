import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isDiscordOAuthConfigured } from "@/lib/discordOAuth";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

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
    },
  });
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="font-display text-lg text-white">Il mio profilo</h1>
      <p className="mt-2 text-slate-400">
        Gestisci le tue credenziali e collega il tuo account Discord.
      </p>
      <div className="mt-6">
        <ProfileForm user={user} discordConfigured={isDiscordOAuthConfigured()} />
      </div>
    </div>
  );
}
