import { LiteBansPanel } from "@/components/dashboard/LiteBansPanel";
import { requireDashboardRole } from "@/components/dashboard/RoleGate";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function LiteBansDashboardPage() {
  await requireDashboardRole("STAFF");

  return (
    <div>
      <PageHeader
        title="Sanzioni (LiteBans)"
        description="Storico completo di ban, mute, warn e kick letto direttamente dal database di LiteBans."
      />
      <div>
        <LiteBansPanel />
      </div>
    </div>
  );
}
