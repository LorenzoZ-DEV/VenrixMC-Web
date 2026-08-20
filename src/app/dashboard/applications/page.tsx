import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { ApplicationsPanel } from "@/components/dashboard/ApplicationsPanel";

export default async function ApplicationsDashboardPage() {
  await requireDashboardRole("HEAD");

  return (
    <div>
      <h1 className="font-display text-lg text-white">Candidature Staff</h1>
      <p className="mt-1 text-slate-400">Rivedi e approva le candidature per lo staff team.</p>
      <div className="mt-6">
        <ApplicationsPanel />
      </div>
    </div>
  );
}
