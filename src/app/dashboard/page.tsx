import { AppealStatus, ApplyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { IconShield, IconMail, IconClipboard, IconUsers, IconNewspaper } from "@/components/icons";

export default async function DashboardOverviewPage() {
  const session = await getSession();
  const isAdmin = hasRole(session, "ADMIN");

  const [appealsPending, appealsTotal, appliesPending] = await Promise.all([
    prisma.appeal.count({ where: { status: AppealStatus.PENDING } }),
    prisma.appeal.count(),
    hasRole(session, "HEAD")
      ? prisma.staffApply.count({ where: { status: ApplyStatus.PENDING } })
      : Promise.resolve(0),
  ]);

  const [users, news] = isAdmin
    ? await Promise.all([prisma.user.count(), prisma.news.count()])
    : [null, null];

  return (
    <div>
      <h1 className="font-display text-lg text-white">Ciao, {session?.username}</h1>
      <p className="mt-2 text-slate-400">Ecco un riepilogo dell'attività su VenrixMC.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <StatCard label="Utenti staff" value={users ?? 0} icon={<IconUsers className="h-5 w-5" />} />
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
