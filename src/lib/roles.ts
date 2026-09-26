import { Role } from "@prisma/client";

/**
 * Role hierarchy — a role can access anything at or below its own rank.
 * MEMBER is rank 0: a forum account with no access to the dashboard, which
 * starts at STAFF. BUILDER (Capo Builder) sits at 0 too: outside the staff
 * ladder, it only gets the Builder applications (see applicationScope).
 */
export const ROLE_RANK: Record<Role, number> = {
  MEMBER: 0,
  BUILDER: 0,
  STAFF: 1,
  HEAD: 2,
  ADMIN: 3,
  DEVELOPER: 4,
};

/** `roles` value the builder wizard stores (lib/wizards/builder.ts). */
export const BUILDER_APPLICATION_ROLE = "Builder";

/**
 * Which staff applications a role may review: HEAD+ all of them, the Capo
 * Builder only the Builder ones, everyone else none (`null`). The object is
 * a Prisma `where` fragment for StaffApply.
 */
export function applicationScope(role: Role): { roles?: string } | null {
  if (ROLE_RANK[role] >= ROLE_RANK.HEAD) return {};
  if (role === "BUILDER") return { roles: BUILDER_APPLICATION_ROLE };
  return null;
}
