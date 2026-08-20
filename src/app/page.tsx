import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PlayerCount } from "@/components/PlayerCount";
import { DiscordCTA } from "@/components/DiscordCTA";
import { JoinServerPanel } from "@/components/JoinServerPanel";
import { NewsCard } from "@/components/NewsCard";
import { PlayerSkinViewer } from "@/components/PlayerSkinViewer";
import { HomeBuildTrigger } from "@/components/HomeBuildTrigger";
import { LinkButton } from "@/components/ui/Button";
import { getServerStatus } from "@/lib/mcsrvstat";
import { getLatestNews } from "@/lib/news";
import { SITE } from "@/lib/constants";
import { IconBook, IconCart, IconChat, IconChevronRight, IconUserPlus, MinecraftCube, PixelFrame } from "@/components/icons";

// Data is Redis-cached at the query layer (see lib/mcsrvstat.ts, lib/news.ts)
// with its own TTLs, so the page itself renders per-request rather than
// relying on Next's static generation (which would require DB/Redis to be
// reachable at build time).
export const dynamic = "force-dynamic";

function buildDelay(ms: number): CSSProperties {
  return { "--build-delay": `${ms}ms` } as CSSProperties;
}

export default async function HomePage() {
  const [status, latestNews] = await Promise.all([getServerStatus(), getLatestNews(3)]);

  return (
    <>
      <HomeBuildTrigger />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <Image
            src="/imgs/background.png"
            alt=""
            fill
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-venrix-radial" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-900/60 to-ink-900" />
        </div>

        <MinecraftCube className="pointer-events-none absolute left-[8%] top-16 h-10 w-10 text-venrix-500/40 sm:h-14 sm:w-14" />
        <MinecraftCube className="pointer-events-none absolute right-[10%] top-32 h-6 w-6 text-venrix-400/30 sm:h-9 sm:w-9" />
        <MinecraftCube className="pointer-events-none absolute bottom-10 left-[18%] h-7 w-7 text-venrix-600/30 sm:h-10 sm:w-10" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-10 px-4 py-24 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Image
              data-build
              style={buildDelay(0)}
              src="/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"
              alt="VenrixMC"
              width={140}
              height={140}
              priority
              className="h-32 w-auto drop-shadow-[0_0_40px_rgba(124,58,237,0.5)]"
            />

            <h1
              data-build
              style={buildDelay(150)}
              className="mt-8 font-display text-xl leading-relaxed text-white sm:text-3xl"
            >
              Benvenuto su <span className="text-venrix-400">VenrixMC</span>
            </h1>
            <p
              data-build
              style={buildDelay(260)}
              className="mt-4 max-w-xl text-lg text-slate-300"
            >
              Un server Minecraft costruito per la community: sopravvivenza, eventi e uno staff
              sempre presente.
            </p>

            <div
              data-build
              style={buildDelay(370)}
              className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
            >
              <PlayerCount initial={status} />
            </div>

            <div
              data-build
              style={buildDelay(480)}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <a href={SITE.storeUrl} target="_blank" rel="noopener noreferrer" className="venrix-btn-primary">
                <IconCart className="h-4 w-4" /> Unisciti ora
              </a>
              <a href={SITE.discordInvite} target="_blank" rel="noopener noreferrer" className="venrix-btn-secondary">
                <IconChat className="h-4 w-4" /> Discord
              </a>
            </div>
          </div>

          <div
            data-build
            style={buildDelay(560)}
            className="flex flex-col items-center gap-8 lg:flex-row lg:items-end"
          >
            <div className="flex flex-col items-center">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="pixel-corners-sm border-2 border-black/40 bg-red-600 px-1.5 py-0.5 font-display text-[8px] uppercase tracking-wide text-white"
                  style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.4)" }}
                >
                  Owner
                </span>
                <span className="text-slate-500">|</span>
                <p className="font-display text-[10px] uppercase tracking-wide text-venrix-400">
                  Venrix__
                </p>
              </div>
              <PlayerSkinViewer username="Venrix__" />
            </div>

            <JoinServerPanel />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div data-build style={buildDelay(680)} className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-lg text-white sm:text-xl">Ultime News</h2>
            <p className="mt-2 text-slate-400">Rimani aggiornato su eventi e novità.</p>
          </div>
          <Link
            href="/news"
            className="inline-flex items-center gap-1 text-sm font-semibold text-venrix-300 hover:text-venrix-200"
          >
            Vedi tutte <IconChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {latestNews.length > 0 ? (
          <div
            data-build
            style={buildDelay(780)}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {latestNews.map((n) => (
              <NewsCard key={n.slug} news={n} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">Nessuna news pubblicata al momento.</p>
        )}
      </section>

      <section className="border-t border-white/10 bg-ink-800/40">
        <div
          data-build
          style={buildDelay(880)}
          className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8"
        >
          <div className="venrix-card p-6">
            <div className="flex items-center gap-3">
              <PixelFrame className="h-10 w-10 text-venrix-300">
                <IconBook className="h-5 w-5" />
              </PixelFrame>
              <h3 className="font-display text-xs text-white">Regolamento</h3>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Leggi le regole del server prima di giocare per evitare sanzioni.
            </p>
            <LinkButton href="/rules" variant="secondary" className="mt-4">
              Leggi le regole
            </LinkButton>
          </div>

          <div className="venrix-card p-6">
            <div className="flex items-center gap-3">
              <PixelFrame className="h-10 w-10 text-venrix-300">
                <IconUserPlus className="h-5 w-5" />
              </PixelFrame>
              <h3 className="font-display text-xs text-white">Diventa Staff</h3>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Cerchiamo membri motivati per aiutare la community. Candidati ora.
            </p>
            <LinkButton href="/staff-apply" variant="secondary" className="mt-4">
              Candidati
            </LinkButton>
          </div>

        </div>
      </section>

      <DiscordCTA />
    </>
  );
}
