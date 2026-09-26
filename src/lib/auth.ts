import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getSession, type SessionData } from "./session";
import { ROLE_RANK, applicationScope } from "./roles";

export { ROLE_RANK };

export function hasRole(session: SessionData | null, minRole: Role): boolean {
  if (!session) return false;
  return ROLE_RANK[session.role] >= ROLE_RANK[minRole];
}

/** For use inside Server Components / pages — redirect handled by caller. */
export async function requireSession(): Promise<SessionData | null> {
  return getSession();
}

/**
 * For use inside API route handlers. Returns the session on success or a
 * ready-to-return NextResponse (401/403) on failure.
 */
export async function requireApiRole(
  minRole: Role
): Promise<{ session: SessionData } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Non autenticato" }, { status: 401 }) };
  }
  if (!hasRole(session, minRole)) {
    return { response: NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 }) };
  }
  return { session };
}

/**
 * Guard for the staff-applications API: HEAD+ see every application, the
 * Capo Builder only the Builder ones. `scope` goes into the Prisma `where`.
 */
export async function requireApplicationReviewer(): Promise<
  { session: SessionData; scope: { roles?: string } } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Non autenticato" }, { status: 401 }) };
  }
  const scope = applicationScope(session.role);
  if (!scope) {
    return { response: NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 }) };
  }
  return { session, scope };
}
