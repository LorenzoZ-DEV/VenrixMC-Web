import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDiscordOAuthConfigured } from "@/lib/discordOAuth";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // I membri non hanno credenziali da gestire qui: il loro profilo e quello del forum.
  if (!hasRole(session, "STAFF")) redirect("/forum/impostazioni");

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
      <PageHeader
        title="Il mio profilo"
        description="Gestisci le tue credenziali e collega il tuo account Discord."
      />
      <div>
        <ProfileForm user={user} discordConfigured={isDiscordOAuthConfigured()} />
      </div>
    </div>
  );
}
