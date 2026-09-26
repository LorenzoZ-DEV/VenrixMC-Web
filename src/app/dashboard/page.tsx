import { redirect } from "next/navigation";
import { AppealStatus, ApplyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { IconShield, IconMail, IconClipboard, IconUsers, IconUser, IconNewspaper } from "@/components/icons";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function DashboardOverviewPage() {
  const session = await getSession();
  // La panoramica e dello staff: i membri atterrano sulle loro richieste.
  if (!hasRole(session, "STAFF")) redirect("/dashboard/richieste");
  const isAdmin = hasRole(session, "ADMIN");

  const [appealsPending, appealsTotal, appliesPending] = await Promise.all([
    prisma.appeal.count({ where: { status: AppealStatus.PENDING } }),
    prisma.appeal.count(),
    hasRole(session, "HEAD")
      ? prisma.staffApply.count({ where: { status: ApplyStatus.PENDING } })
      : Promise.resolve(0),
  ]);

  const [staffUsers, members, news] = isAdmin
    ? await Promise.all([
        prisma.user.count({ where: { role: { not: "MEMBER" } } }),
        prisma.user.count({ where: { role: "MEMBER" } }),
        prisma.news.count(),
      ])
    : [null, null, null];

  return (
    <div>
      <PageHeader
        title={<>Ciao, {session?.username}</>}
        description="Ecco un riepilogo dell'attività su VenrixMC."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Appeals in attesa"
          value={appealsPending}
          icon={<IconShield className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard label="Appeals totali" value={appealsTotal} icon={<IconMail className="h-5 w-5" />} />
        {hasRole(session, "HEAD") && (
          <StatCard
            label="Candidature in attesa"
            value={appliesPending}
            icon={<IconClipboard className="h-5 w-5" />}
            tone="warning"
          />
        )}
        {isAdmin && (
          <StatCard label="Staff registrati" value={staffUsers ?? 0} icon={<IconUsers className="h-5 w-5" />} />
        )}
        {isAdmin && (
          <StatCard label="Utenti registrati" value={members ?? 0} icon={<IconUser className="h-5 w-5" />} />
        )}
        {isAdmin && (
          <StatCard
            label="News pubblicate"
            value={news ?? 0}
            icon={<IconNewspaper className="h-5 w-5" />}
            tone="success"
          />
        )}
      </div>
    </div>
  );
}
