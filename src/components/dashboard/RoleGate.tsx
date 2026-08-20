import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";

/** Server-side guard for dashboard subpages that require more than STAFF. */
export async function requireDashboardRole(minRole: Role) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasRole(session, minRole)) redirect("/dashboard");
  return session;
}
