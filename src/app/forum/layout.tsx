import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MemberAvatar } from "@/components/forum/MemberAvatar";
import { ForumSearchBox } from "@/components/forum/ForumSearchBox";
import { IconChat, IconUsers, IconKey, IconGear, IconMail } from "@/components/icons";

export const metadata: Metadata = { title: "Forum · VenrixMC" };

/**
 * Testata comune a tutte le pagine del forum: identita del membro, ricerca e
 * scorciatoie. Sta in un layout e non in ogni pagina perche la sessione si
 * legge una volta sola per navigazione.
 */
export default async function ForumLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const me = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { username: true, discordAvatar: true, minecraftName: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/forum" className="flex items-center gap-2.5">
            <span className="pixel-corners-sm flex h-10 w-10 items-center justify-center bg-venrix-600/15 text-venrix-300">
              <IconChat className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display text-lg font-bold leading-tight text-white">
                Forum
              </span>
              <span className="block text-xs text-slate-500">La community di VenrixMC</span>
            </span>
          </Link>

          <nav className="ml-2 hidden items-center gap-4 sm:flex">
            <Link href="/forum/membri" className="nav-link">
              <IconUsers className="h-4 w-4 opacity-70" />
              Membri
            </Link>
            {session && (
              <Link href="/forum/impostazioni" className="nav-link">
                <IconGear className="h-4 w-4 opacity-70" />
                Profilo
              </Link>
            )}
            {session && (
              <Link href="/dashboard/richieste" className="nav-link">
                <IconMail className="h-4 w-4 opacity-70" />
                Le mie richieste
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ForumSearchBox />

          {me ? (
            <Link
              href={`/forum/utente/${me.username}`}
              className="pixel-corners-sm flex items-center gap-2 border border-white/10 bg-ink-700 px-2.5 py-1.5 transition hover:border-venrix-500/40"
            >
              <MemberAvatar user={me} size={24} />
              <span className="max-w-[10rem] truncate text-sm font-medium text-slate-200">
                {me.username}
              </span>
            </Link>
          ) : (
            <Link href="/forum/accedi" className="venrix-btn-primary h-10 px-4 py-0 text-sm">
              <IconKey className="h-4 w-4" />
              Accedi
            </Link>
          )}

          {hasRole(session, "ADMIN") && (
            <Link
              href="/dashboard/forum"
              className="pixel-corners-sm hidden items-center gap-1.5 border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:text-venrix-200 sm:inline-flex"
            >
              <IconGear className="h-4 w-4" />
              Gestisci
            </Link>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
