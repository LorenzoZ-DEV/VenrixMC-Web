import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMemberProfile, getStaffRanks, rankKey } from "@/lib/forum";
import { contentPreview, timeAgo, fullDate } from "@/lib/forumFormat";
import { StaffSkin } from "@/components/StaffSkin";
import { MemberAvatar } from "@/components/forum/MemberAvatar";
import { RankBadge } from "@/components/forum/RankBadge";
import { IconChat, IconNewspaper, IconGear } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  return { title: `${decodeURIComponent(params.username)} · Forum VenrixMC` };
}

export default async function MemberProfilePage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const profile = await getMemberProfile(username);
  if (!profile) notFound();

  const { user, topics, recentPosts } = profile;
  const session = await getSession();
  const ranks = await getStaffRanks([user]);
  const rank = ranks.get(rankKey(user));
  const isMe = session?.userId === user.id;

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <aside className="venrix-card h-fit p-6 text-center">
        {user.minecraftName ? (
          <div className="flex justify-center">
            <StaffSkin username={user.minecraftName} />
          </div>
        ) : (
          <div className="flex justify-center">
            <MemberAvatar user={user} size={96} />
          </div>
        )}

        <h1 className="mt-4 font-display text-lg font-bold text-white">{user.username}</h1>
        <div className="mt-2 flex justify-center">
          <RankBadge rank={rank} role={user.role} />
        </div>

        {user.minecraftName && (
          <p className="mt-2 text-xs text-slate-500">
            In gioco come <span className="text-slate-300">{user.minecraftName}</span>
          </p>
        )}

        <dl className="mt-5 space-y-2 border-t border-white/5 pt-4 text-left text-sm">
          <Row icon={<IconNewspaper className="h-3.5 w-3.5" />} label="Messaggi" value={user.postCount} />
          <Row icon={<IconChat className="h-3.5 w-3.5" />} label="Discussioni" value={topics} />
        </dl>

        <p className="mt-4 text-xs text-slate-500">
          Iscritto il {fullDate(user.createdAt)}
          {user.lastSeenAt && (
            <>
              <br />
              Ultima attività {timeAgo(user.lastSeenAt)}
            </>
          )}
        </p>

        {isMe && (
          <Link
            href="/forum/impostazioni"
            className="venrix-btn-secondary mt-5 w-full px-4 py-2 text-sm"
          >
            <IconGear className="h-4 w-4" />
            Modifica profilo
          </Link>
        )}
      </aside>

      <div className="space-y-6">
        {user.bio && (
          <section className="venrix-card p-5">
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-venrix-300">
              Presentazione
            </h2>
            <p className="whitespace-pre-line text-sm text-slate-300">{user.bio}</p>
          </section>
        )}

        <section className="venrix-card overflow-hidden">
          <h2 className="border-b border-white/5 px-5 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-venrix-300">
            Ultimi messaggi
          </h2>

          {recentPosts.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              {user.username} non ha ancora scritto niente.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {recentPosts.map((post) => (
                <li key={post.id} className="p-4 transition hover:bg-white/[0.03]">
                  <Link
                    href={`/forum/${post.topic.board.slug}/${post.topic.slug}#post-${post.id}`}
                    className="font-display text-sm font-semibold text-white hover:text-venrix-300"
                  >
                    {post.topic.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                    {contentPreview(post.content, 200)}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">{timeAgo(post.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-slate-400">
        <span className="text-venrix-400">{icon}</span>
        {label}
      </dt>
      <dd className="font-display font-bold text-white">{value}</dd>
    </div>
  );
}
