import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";

/**
 * Server-side guard for dashboard subpages. The layout lets MEMBER accounts
 * in too, so every staff page must call this — members bounce to their own
 * requests page, staff without enough rank back to the overview.
 */
export async function requireDashboardRole(minRole: Role) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasRole(session, minRole)) {
    redirect(hasRole(session, "STAFF") ? "/dashboard" : "/dashboard/richieste");
  }
  return session;
}
