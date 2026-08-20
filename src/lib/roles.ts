import { Role } from "@prisma/client";

/** Role hierarchy — a role can access anything at or below its own rank. */
export const ROLE_RANK: Record<Role, number> = {
  STAFF: 1,
  HEAD: 2,
  ADMIN: 3,
  DEVELOPER: 4,
};
