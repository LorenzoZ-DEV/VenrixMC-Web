import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { NewsPanel } from "@/components/dashboard/NewsPanel";

export default async function NewsDashboardPage() {
  await requireDashboardRole("ADMIN");

  return (
    <div>
      <h1 className="font-display text-lg text-white">Gestione News</h1>
      <p className="mt-1 text-slate-400">Crea, modifica e pubblica gli annunci del server.</p>
      <div className="mt-6">
        <NewsPanel />
      </div>
    </div>
  );
}
