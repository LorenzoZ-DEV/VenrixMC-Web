import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { ForumMembersPanel } from "@/components/dashboard/ForumMembersPanel";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function ForumMembersDashboardPage() {
  await requireDashboardRole("HEAD");

  return (
    <div>
      <PageHeader
        title="Membri del forum"
        description={<>Silenzia chi disturba o disattiva un account. Il ruolo si cambia da{" "} <strong>Utenti</strong>.</>}
      />
      <div>
        <ForumMembersPanel />
      </div>
    </div>
  );
}
