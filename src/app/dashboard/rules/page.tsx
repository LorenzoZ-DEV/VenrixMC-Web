import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { RulesEditor } from "@/components/dashboard/RulesEditor";
import { getRulesContent } from "@/lib/settings";

export default async function RulesDashboardPage() {
  await requireDashboardRole("ADMIN");
  const content = await getRulesContent();

  return (
    <div>
      <h1 className="font-display text-lg text-white">Regolamento</h1>
      <p className="mt-1 text-slate-400">Modifica il contenuto pubblico della pagina Rules.</p>
      <div className="mt-6">
        <RulesEditor initialContent={content} />
      </div>
    </div>
  );
}
