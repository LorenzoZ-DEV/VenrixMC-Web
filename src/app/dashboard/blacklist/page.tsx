import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { BlacklistPanel } from "@/components/dashboard/BlacklistPanel";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function BlacklistDashboardPage() {
  await requireDashboardRole("HEAD");

  return (
    <div>
      <PageHeader
        title="Blacklist candidature"
        description="Chi compare qui non può inviare candidature staff. Il blocco scatta se combacia anche uno solo fra UUID, nick e ID Discord, e la persona vede il motivo che scrivi."
      />
      <div>
        <BlacklistPanel />
      </div>
    </div>
  );
}
