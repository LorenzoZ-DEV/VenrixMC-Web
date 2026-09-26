import Link from "next/link";
import { getSession } from "@/lib/session";
import { getForumIndex, getForumStats, getLatestTopics } from "@/lib/forum";
import { boardIcon } from "@/lib/forumMeta";
import { timeAgo } from "@/lib/forumFormat";
import { MemberAvatar } from "@/components/forum/MemberAvatar";
import { TagPill } from "@/components/forum/TagPill";
import { IconLock, IconChat, IconUsers, IconNewspaper } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ForumIndexPage({
  searchParams,
}: {
  searchParams: { auth?: string };
}) {
  const session = await getSession();
  const [categories, stats, latest] = await Promise.all([
    getForumIndex(session),
    getForumStats(),
    getLatestTopics(session),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        {/* Primo accesso: l'account e appena stato creato dal callback OAuth. */}
        {searchParams.auth === "welcome" && (
          <div className="pixel-corners border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
            <p className="font-display text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Benvenuto nel forum di VenrixMC
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Il tuo account è pronto.{" "}
              <Link href="/forum/impostazioni" className="text-venrix-300 hover:underline">
                Aggiungi il tuo nick Minecraft
              </Link>{" "}
              per far comparire la tua skin accanto ai messaggi.
            </p>
          </div>
        )}

        {categories.length === 0 && (
          <div className="venrix-card p-10 text-center">
            <p className="font-display text-base text-white">Il forum non è ancora aperto</p>
            <p className="mt-2 text-sm text-slate-400">
              Le sezioni si creano dalla dashboard, in <strong>Forum</strong>.
            </p>
          </div>
        )}

        {categories.map((category) => (
          <section key={category.id}>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-base font-bold uppercase tracking-wider text-venrix-300">
                {category.name}
              </h2>
              {category.description && (
                <p className="truncate text-xs text-slate-500">{category.description}</p>
              )}
            </div>

            <div className="venrix-card divide-y divide-white/5 overflow-hidden">
              {category.boards.map((board) => {
                const Icon = boardIcon(board.icon);
                return (
                  <div
                    key={board.id}
                    className="flex flex-col gap-3 p-4 transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:gap-5"
                  >
                    <span className="pixel-corners-sm flex h-11 w-11 shrink-0 items-center justify-center bg-venrix-600/12 text-venrix-300">
                      <Icon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/forum/${board.slug}`}
                          className="font-display text-[15px] font-semibold text-white hover:text-venrix-300"
                        >
                          {board.name}
                        </Link>
                        {board.locked && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <IconLock className="h-3 w-3" /> sola lettura
                          </span>
                        )}
                        {board.readRole && (
                          <span className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                            {board.readRole}
                          </span>
                        )}
                        {!board.visible && (
                          <span className="rounded-sm border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                            nascosto
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-slate-400">
                        {board.description}
                      </p>

                      {/* Sotto-sezioni: link compatti sotto la descrizione del padre. */}
                      {board.children.length > 0 && (
                        <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {board.children.map((child) => {
                            const ChildIcon = boardIcon(child.icon);
                            return (
                              <li key={child.id}>
                                <Link
                                  href={`/forum/${child.slug}`}
                                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-venrix-300"
                                >
                                  <ChildIcon className="h-3 w-3" />
                                  {child.name}
                                  <span className="text-slate-600">({child.stats.topics})</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-6 text-center sm:w-32">
                      <div>
                        <p className="font-display text-base font-bold text-white">
                          {board.stats.topics}
                        </p>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">
                          Discussioni
                        </p>
                      </div>
                      <div>
                        <p className="font-display text-base font-bold text-white">
                          {board.stats.posts}
                        </p>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Post</p>
                      </div>
                    </div>

                    <div className="shrink-0 sm:w-56">
                      {board.lastTopic ? (
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar
                            user={board.lastTopic.lastPostBy ?? board.lastTopic.author}
                            size={32}
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/forum/${board.lastTopic.board.slug}/${board.lastTopic.slug}`}
                              className="block truncate text-sm font-medium text-slate-200 hover:text-venrix-300"
                            >
                              {board.lastTopic.title}
                            </Link>
                            <p className="truncate text-xs text-slate-500">
                              {(board.lastTopic.lastPostBy ?? board.lastTopic.author).username} ·{" "}
                              {timeAgo(board.lastTopic.lastPostAt)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600">Nessuna discussione</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <aside className="space-y-6">
        <div className="venrix-card p-5">
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-venrix-300">
            Statistiche
          </h3>
          <dl className="space-y-2.5 text-sm">
            <Stat icon={<IconChat className="h-4 w-4" />} label="Discussioni" value={stats.topics} />
            <Stat
              icon={<IconNewspaper className="h-4 w-4" />}
              label="Messaggi"
              value={stats.posts}
            />
            <Stat icon={<IconUsers className="h-4 w-4" />} label="Membri" value={stats.members} />
          </dl>
          {stats.newestMember && (
            <p className="mt-4 border-t border-white/5 pt-3 text-xs text-slate-500">
              Ultimo iscritto:{" "}
              <Link
                href={`/forum/utente/${stats.newestMember}`}
                className="font-medium text-venrix-300 hover:underline"
              >
                {stats.newestMember}
              </Link>
            </p>
          )}
        </div>

        <div className="venrix-card p-5">
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-venrix-300">
            Ultimi messaggi
          </h3>
          {latest.length === 0 ? (
            <p className="text-sm text-slate-500">Ancora niente da leggere.</p>
          ) : (
            <ul className="space-y-3.5">
              {latest.map((topic) => (
                <li key={topic.slug} className="flex gap-2.5">
                  <MemberAvatar user={topic.author} size={30} />
                  <div className="min-w-0">
                    <Link
                      href={`/forum/${topic.board.slug}/${topic.slug}`}
                      className="line-clamp-2 text-sm font-medium text-slate-200 hover:text-venrix-300"
                    >
                      {topic.title}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span>{topic.board.name}</span>
                      <span>·</span>
                      <span>{timeAgo(topic.lastPostAt)}</span>
                      {topic.tags[0] && <TagPill tag={topic.tags[0]} className="ml-0.5" />}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-slate-400">
        <span className="text-venrix-400">{icon}</span>
        {label}
      </dt>
      <dd className="font-display font-bold text-white">{value.toLocaleString("it-IT")}</dd>
    </div>
  );
}
