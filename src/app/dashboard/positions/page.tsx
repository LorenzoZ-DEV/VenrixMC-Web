import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { PositionsPanel } from "@/components/dashboard/PositionsPanel";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function PositionsDashboardPage() {
  await requireDashboardRole("HEAD");

  return (
    <div>
      <PageHeader
        title="Posizioni Staff"
        description="Apri, chiudi e gestisci i posti disponibili per ogni ruolo mostrato su /staff-apply."
      />
      <div>
        <PositionsPanel />
      </div>
    </div>
  );
}
