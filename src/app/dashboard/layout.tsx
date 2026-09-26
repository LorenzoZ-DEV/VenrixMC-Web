import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  // Anche i MEMBER entrano, ma vedono solo "Le mie richieste": ogni pagina
  // staff si protegge da sola con requireDashboardRole.

  return (
    <DashboardShell role={session.role} username={session.username}>
      {children}
    </DashboardShell>
  );
}
