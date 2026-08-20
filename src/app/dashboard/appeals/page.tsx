import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { AppealsPanel } from "@/components/dashboard/AppealsPanel";

export default async function AppealsDashboardPage() {
  const session = await getSession();
  const canDelete = hasRole(session, "ADMIN");

  return (
    <div>
      <h1 className="font-display text-lg text-white">Ban Appeals</h1>
      <p className="mt-1 text-slate-400">Gestisci le richieste di rimozione ban dei giocatori.</p>
      <div className="mt-6">
        <AppealsPanel canDelete={canDelete} />
      </div>
    </div>
  );
}
