import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { UsersPanel } from "@/components/dashboard/UsersPanel";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function UsersDashboardPage() {
  const session = await requireDashboardRole("ADMIN");

  return (
    <div>
      <PageHeader
        title="Gestione Utenti"
        description="Account dello staff e utenti registrati con Discord: da qui gestisci ruoli e accessi."
      />
      <div>
        <UsersPanel currentUserId={session.userId} />
      </div>
    </div>
  );
}
