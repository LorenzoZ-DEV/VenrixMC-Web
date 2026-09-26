import { hasRole } from "@/lib/auth";
import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { AppealsPanel } from "@/components/dashboard/AppealsPanel";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function AppealsDashboardPage() {
  const session = await requireDashboardRole("STAFF");
  const canDelete = hasRole(session, "ADMIN");

  return (
    <div>
      <PageHeader
        title="Ban Appeals"
        description="Gestisci le richieste di rimozione ban dei giocatori."
      />
      <div>
        <AppealsPanel canDelete={canDelete} />
      </div>
    </div>
  );
}
