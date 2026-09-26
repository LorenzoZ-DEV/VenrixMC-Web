import { prisma } from "./prisma";
import { cached, TTL } from "./cache";
import { keys } from "./redis";
import type { StaffMemberData } from "./team";

export const STAFF_MEMBERS_CACHE_KEY = keys.cache("staff-members", "all");

/**
 * I membri visibili nella vetrina pubblica, gia ordinati.
 *
 * Passa dalla cache Redis perche /staff e una pagina molto visitata che
 * altrimenti interrogherebbe il database a ogni richiesta; le rotte in
 * /api/staff-members invalidano la chiave a ogni scrittura, quindi una
 * modifica fatta dalla dashboard si vede subito.
 */
export async function getStaffMembers(): Promise<StaffMemberData[]> {
  return cached(STAFF_MEMBERS_CACHE_KEY, TTL.STAFF_MEMBERS, async () => {
    const rows = await prisma.staffMember.findMany({
      where: { visible: true },
      orderBy: [{ order: "asc" }, { username: "asc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      role: r.role,
      description: r.description,
      order: r.order,
      visible: r.visible,
    }));
  });
}
