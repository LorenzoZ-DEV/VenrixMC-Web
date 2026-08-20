import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { UsersPanel } from "@/components/dashboard/UsersPanel";

export default async function UsersDashboardPage() {
  const session = await requireDashboardRole("ADMIN");

  return (
    <div>
      <h1 className="font-display text-lg text-white">Gestione Utenti</h1>
      <p className="mt-1 text-slate-400">Crea account staff e gestisci i ruoli.</p>
      <div className="mt-6">
        <UsersPanel currentUserId={session.userId} />
      </div>
    </div>
  );
}
