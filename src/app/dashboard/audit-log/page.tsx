import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { prisma } from "@/lib/prisma";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function AuditLogPage() {
  await requireDashboardRole("ADMIN");

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 100,
    include: { user: { select: { username: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Ultime 100 azioni registrate sul pannello."
      />
      <div className="venrix-card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Utente</th>
              <th className="px-4 py-3">Azione</th>
              <th className="px-4 py-3">Dettagli</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Nessuna azione registrata.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-white">
                    {log.user?.username ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-venrix-300">{log.action}</td>
                  <td className="px-4 py-3 text-slate-400">{log.details ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(log.timestamp).toLocaleString("it-IT")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
