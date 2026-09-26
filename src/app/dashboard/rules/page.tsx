import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { RulesEditor } from "@/components/dashboard/RulesEditor";
import { getRulesContent, getSetting } from "@/lib/settings";
import { parseRulesFormat } from "@/lib/rulesFormat";

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function RulesDashboardPage() {
  await requireDashboardRole("ADMIN");
  const [content, formatRaw] = await Promise.all([
    getRulesContent(),
    getSetting("rules_format"),
  ]);

  return (
    <div>
      <PageHeader
        title="Regolamento"
        description="Modifica il contenuto pubblico della pagina Rules."
      />
      <div>
        <RulesEditor initialContent={content} initialFormat={parseRulesFormat(formatRaw)} />
      </div>
    </div>
  );
}
