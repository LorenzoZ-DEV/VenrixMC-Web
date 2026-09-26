import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { applicationScope } from "@/lib/roles";
import { ApplicationsPanel } from "@/components/dashboard/ApplicationsPanel";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function ApplicationsDashboardPage() {
  // Head Staff+ vedono tutte le candidature, il Capo Builder solo le Builder:
  // il filtro vero lo applica l'API, qui cambia solo il titolo.
  const session = await getSession();
  if (!session) redirect("/login");
  if (!applicationScope(session.role)) {
    redirect(hasRole(session, "STAFF") ? "/dashboard" : "/dashboard/richieste");
  }
  const builderOnly = session.role === "BUILDER";

  return (
    <div>
      <PageHeader
        title={builderOnly ? "Candidature Builder" : "Candidature Staff"}
        description={builderOnly ? "Rivedi e approva le candidature per il ruolo Builder." : "Rivedi e approva le candidature per lo staff team."}
      />
      <div>
        <ApplicationsPanel />
      </div>
    </div>
  );
}
