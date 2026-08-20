import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { PositionsPanel } from "@/components/dashboard/PositionsPanel";

export default async function PositionsDashboardPage() {
  await requireDashboardRole("HEAD");

  return (
    <div>
      <h1 className="font-display text-lg text-white">Posizioni Staff</h1>
      <p className="mt-2 text-slate-400">
        Apri, chiudi e gestisci i posti disponibili per ogni ruolo mostrato su /staff-apply.
      </p>
      <div className="mt-6">
        <PositionsPanel />
      </div>
    </div>
  );
}
