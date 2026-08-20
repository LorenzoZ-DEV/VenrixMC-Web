import { prisma } from "./prisma";
import { cached, TTL } from "./cache";
import { keys } from "./redis";

export type StaffPositionData = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  icon: string;
  slots: number;
  open: boolean;
  requirements: string[];
  wizardId: string | null;
  order: number;
};

/** All positions (open and closed), ordered for display — cached in Redis, invalidated on any write via the /api/staff-positions routes. */
export async function getStaffPositions(): Promise<StaffPositionData[]> {
  return cached(keys.cache("staff-positions", "all"), TTL.STAFF_POSITIONS, async () => {
    const rows = await prisma.staffPosition.findMany({ orderBy: { order: "asc" } });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      tagline: r.tagline,
      icon: r.icon,
      slots: r.slots,
      open: r.open,
      requirements: Array.isArray(r.requirements) ? (r.requirements as string[]) : [],
      wizardId: r.wizardId,
      order: r.order,
    }));
  });
}
