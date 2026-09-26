import Link from "next/link";
import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { ForumPanel } from "@/components/dashboard/ForumPanel";
import { IconChevronRight } from "@/components/icons";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function ForumDashboardPage() {
  await requireDashboardRole("ADMIN");

  return (
    <div>
      {/* Questa pagina aveva gia' un'azione in alto a destra: ora sta nello
          slot `actions`, lo stesso posto in cui la cercherai su ogni altra
          pagina della dashboard. */}
      <PageHeader
        title="Forum"
        description="Struttura del forum: categorie, sezioni ed etichette delle discussioni."
        actions={
          <Link
            href="/forum"
            target="_blank"
            className="pixel-btn-secondary px-4 py-2 text-sm"
          >
            Vedi il forum <IconChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div>
        <ForumPanel />
      </div>
    </div>
  );
}
