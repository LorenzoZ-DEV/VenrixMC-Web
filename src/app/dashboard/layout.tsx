import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-ink-800">
      <Sidebar role={session.role} username={session.username} />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</div>
    </div>
  );
}
