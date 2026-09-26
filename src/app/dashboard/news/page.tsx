import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { NewsPanel } from "@/components/dashboard/NewsPanel";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function NewsDashboardPage() {
  await requireDashboardRole("ADMIN");

  return (
    <div>
      <PageHeader
        title="Gestione News"
        description="Crea, modifica e pubblica gli annunci del server."
      />
      <div>
        <NewsPanel />
      </div>
    </div>
  );
}
