import type { Metadata } from "next";
import Link from "next/link";
import { getMembersPage, getStaffRanks, rankKey } from "@/lib/forum";
import { timeAgo } from "@/lib/forumFormat";
import { Pagination } from "@/components/Pagination";
import { MemberAvatar } from "@/components/forum/MemberAvatar";
import { RankBadge } from "@/components/forum/RankBadge";

export const metadata: Metadata = { title: "Membri · Forum VenrixMC" };
export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const page = Number(searchParams.page ?? "1") || 1;
  const { items, total, totalPages } = await getMembersPage(page, searchParams.q?.trim());
  const ranks = await getStaffRanks(items);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-xl font-bold text-white">Membri</h1>
        <p className="mt-1 text-sm text-slate-400">
          {total} {total === 1 ? "iscritto" : "iscritti"}, ordinati per messaggi scritti.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((member) => (
          <Link
            key={member.id}
            href={`/forum/utente/${member.username}`}
            className="venrix-card flex items-center gap-3.5 p-4 transition hover:border-venrix-500/40"
          >
            <MemberAvatar user={member} size={48} />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-white">
                {member.username}
              </p>
              <RankBadge rank={ranks.get(rankKey(member))} role={member.role} className="mt-1" />
              <p className="mt-1.5 text-[11px] text-slate-500">
                {member.postCount} messaggi · iscritto {timeAgo(member.createdAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {items.length === 0 && (
        <div className="venrix-card p-10 text-center text-sm text-slate-500">
          Nessun membro trovato.
        </div>
      )}

      <Pagination
        basePath="/forum/membri"
        currentPage={page}
        totalPages={totalPages}
        query={{ q: searchParams.q }}
      />
    </div>
  );
}
