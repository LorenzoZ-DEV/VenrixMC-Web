import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Badge, StatusBadge, statusLabel, statusTone } from "@/components/ui/Badge";
import { IconClipboard, IconShield } from "@/components/icons";
import { APPLY_COOLDOWN_DAYS, formatItDate, getApplyEligibility } from "@/lib/applyCooldown";

import { PageHeader } from "@/components/dashboard/PageHeader";
/**
 * Dashboard personale: le candidature staff e i ban appeal inviati da
 * questo account, con il loro stato. E l'unica pagina che vede un MEMBER,
 * ma la vede anche lo staff per le proprie richieste.
 */
export default async function MyRequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [applications, appeals, eligibility] = await Promise.all([
    prisma.staffApply.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, roles: true, minecraftName: true, status: true, createdAt: true },
    }),
    prisma.appeal.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, minecraftName: true, banId: true, status: true, createdAt: true },
    }),
    getApplyEligibility(session.userId),
  ]);

  return (
    <div>
      <PageHeader
        title="Le mie richieste"
        description="Lo stato delle tue candidature staff e dei tuoi ban appeal."
      />
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-sm text-white">
            <IconClipboard className="h-4 w-4 text-venrix-300" /> Candidature staff
          </h2>
          {eligibility.allowed ? (
            <Link href="/staff-apply" className="venrix-btn-primary h-9 px-4 py-0 text-sm">
              Invia una candidatura
            </Link>
          ) : (
            <p className="text-xs text-slate-500">
              Prossima candidatura possibile dal {formatItDate(eligibility.nextAt)} (una ogni{" "}
              {APPLY_COOLDOWN_DAYS} giorni)
            </p>
          )}
        </div>

        <div className="venrix-card mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Ruolo</th>
                <th className="px-4 py-3">Nome Minecraft</th>
                <th className="px-4 py-3">Inviata il</th>
                <th className="px-4 py-3">Stato</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Non hai ancora inviato candidature.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{app.roles}</td>
                    <td className="px-4 py-3 text-slate-400">{app.minecraftName}</td>
                    <td className="px-4 py-3 text-slate-400">{formatItDate(app.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-sm text-white">
            <IconShield className="h-4 w-4 text-venrix-300" /> Ban appeals
          </h2>
          <Link href="/appeals" className="venrix-btn-secondary h-9 px-4 py-0 text-sm">
            Invia un appeal
          </Link>
        </div>

        <div className="venrix-card mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Nome Minecraft</th>
                <th className="px-4 py-3">ID ban</th>
                <th className="px-4 py-3">Inviato il</th>
                <th className="px-4 py-3">Stato</th>
              </tr>
            </thead>
            <tbody>
              {appeals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Nessun appeal inviato da questo account.
                  </td>
                </tr>
              ) : (
                appeals.map((appeal) => (
                  <tr key={appeal.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{appeal.minecraftName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {appeal.banId ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatItDate(appeal.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(appeal.status)}>{statusLabel(appeal.status)}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Qui compaiono solo gli appeal inviati mentre avevi fatto l&apos;accesso.
        </p>
      </section>
    </div>
  );
}
