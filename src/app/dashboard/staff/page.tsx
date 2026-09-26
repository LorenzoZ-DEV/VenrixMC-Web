import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { StaffMembersPanel } from "@/components/dashboard/StaffMembersPanel";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function StaffMembersDashboardPage() {
  await requireDashboardRole("ADMIN");

  return (
    <div>
      <PageHeader
        title="Lista Staff"
        description="Chi compare nella pagina pubblica /staff, con che ruolo e in che ordine."
      />
      <div>
        <StaffMembersPanel />
      </div>
    </div>
  );
}
