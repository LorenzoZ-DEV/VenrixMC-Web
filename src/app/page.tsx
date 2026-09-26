import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PlayerCount } from "@/components/PlayerCount";
import { DiscordCTA } from "@/components/DiscordCTA";
import { JoinServerPanel } from "@/components/JoinServerPanel";
import { NewsCard } from "@/components/NewsCard";
import { PlayerSkinViewer } from "@/components/PlayerSkinViewer";
import { HomeBuildTrigger } from "@/components/HomeBuildTrigger";
import { HowToPlay } from "@/components/HowToPlay";
import { getServerStatus } from "@/lib/mcsrvstat";
import { getLatestNews } from "@/lib/news";
import { SITE } from "@/lib/constants";
import {
  IconBook,
  IconCart,
  IconChat,
  IconChevronRight,
  IconUserPlus,
  PixelFrame,
} from "@/components/icons";

// Data is Redis-cached at the query layer (see lib/mcsrvstat.ts, lib/news.ts)
// with its own TTLs, so the page itself renders per-request rather than
// relying on Next's static generation (which would require DB/Redis to be
// reachable at build time).
export const dynamic = "force-dynamic";

function buildDelay(ms: number): CSSProperties {
  return { "--build-delay": `${ms}ms` } as CSSProperties;
}

/**
 * Le due scorciatoie sotto le news. Sono link interi, non card con un
 * bottone dentro: un bottone annidato in una card cliccabile darebbe due
 * bersagli sovrapposti (e un <a> dentro un <a>, che l'HTML non ammette).
 */
const SHORTCUTS = [
  {
    href: "/rules",
    icon: IconBook,
    title: "Regolamento",
    body: "Le regole del server, scritte per esteso. Leggile prima di giocare: quasi tutte le sanzioni nascono da qui.",
    cta: "Leggi le regole",
  },
  {
    href: "/staff-apply",
    icon: IconUserPlus,
    title: "Diventa staff",
    body: "Cerchiamo helper, supporter e builder. Se passi tempo sul server e vuoi darci una mano, candidati.",
    cta: "Apri la candidatura",
  },
];

export default async function HomePage() {
  const [status, latestNews] = await Promise.all([getServerStatus(), getLatestNews(3)]);

  const [featured, ...rest] = latestNews;

  return (
    <>
      <HomeBuildTrigger />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0" aria-hidden>
          <Image
            src="/imgs/background.png"
            alt=""
            fill
            priority
            // Lo screenshot e' scuro: al chiaro va tenuto piu' in secondo piano,
            // altrimenti sporca il fondo invece di dargli profondita'.
            className="object-cover opacity-25 dark:opacity-40"
          />
          {/* Texture di pietra sopra lo screenshot: il fondo smette di
              essere una foto sfocata e diventa una superficie. */}
          <div className="absolute inset-0 glow-brand" />
          <div className="absolute inset-0 bg-venrix-radial" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-800/40 via-ink-800/75 to-ink-800" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-14 px-4 py-24 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:py-32 lg:px-8">
          {/*
            Quattro elementi in tutto: titolo, testo, stato del server,
            azioni. Il logo grande e la striscia "Survival · 1.20+ · IT" che
            stavano qui sono usciti: il logo si ripeteva a venti pixel da
            quello dell'intestazione, e la striscia era decorazione che
            spingeva le azioni fuori dalla prima schermata.
          */}
          <div className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
            <h1
              data-build
              style={buildDelay(0)}
              className="display-title "
            >
              Costruisci
              <br />
              <span className="text-venrix-500">il tuo posto</span>
            </h1>

            <p
              data-build
              style={buildDelay(120)}
              className="mt-7 max-w-[48ch] text-[17px] leading-relaxed text-slate-300 sm:text-lg"
            >
              Un server Minecraft costruito per la community: sopravvivenza, eventi e uno staff
              sempre presente.
            </p>

            <div data-build style={buildDelay(230)} className="mt-8">
              <PlayerCount initial={status} />
            </div>

            <div
              data-build
              style={buildDelay(340)}
              className="mt-9 flex w-full flex-wrap items-center justify-center gap-3.5 lg:justify-start"
            >
              <a
                href={SITE.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="venrix-btn-primary"
              >
                <IconCart className="h-4 w-4" /> Unisciti ora
              </a>
              <a
                href={SITE.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="venrix-btn-secondary"
              >
                <IconChat className="h-4 w-4" /> Discord
              </a>
            </div>
          </div>

          <div
            data-build
            style={buildDelay(450)}
            className="flex flex-col items-center gap-8 lg:flex-row lg:items-end"
          >
            <div className="flex flex-col items-center">
              {/* Nome sopra la testa, come nel gioco: etichetta scura con
                  l'ombra del testo, non una targhetta da interfaccia web. */}
              <p className="mb-2 bg-black/55 px-2.5 py-1 font-display text-sm text-white">
                <span className="text-red-400">[Owner]</span> Venrix__
              </p>
              <PlayerSkinViewer username="Venrix__" />
            </div>

            <JoinServerPanel />
          </div>
        </div>
      </section>

      <HowToPlay />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div
          data-build
          style={buildDelay(680)}
          className="mb-10 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <span className="section-eyebrow">Aggiornamenti</span>
            <h2 className="section-title">Ultime news</h2>
            <p className="section-lead">Eventi, aggiornamenti e novità dal server.</p>
          </div>
          <Link
            href="/news"
            className="group inline-flex items-center gap-1.5 text-[15px] font-semibold text-venrix-200"
          >
            Vedi tutte
            <IconChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {featured ? (
          /*
            Apertura asimmetrica invece di tre colonne uguali: la notizia piu'
            recente prende la colonna larga e l'immagine alta, le altre due si
            impilano accanto. Con una sola news la griglia collassa da sola a
            una colonna, senza rami separati nel markup.
          */
          <div
            data-build
            style={buildDelay(780)}
            className="grid gap-7 lg:grid-cols-[1.35fr_1fr] lg:items-stretch"
          >
            <NewsCard news={featured} featured />
            {rest.length > 0 && (
              <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-1">
                {rest.map((n) => (
                  <NewsCard key={n.slug} news={n} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Stato vuoto composto, non una riga di testo grigio persa nella
             pagina: la sezione resta leggibile anche a bacheca vuota. */
          <div className="venrix-card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <PixelFrame className="h-12 w-12 text-venrix-200">
              <IconBook className="h-5 w-5" />
            </PixelFrame>
            <p className="font-display text-lg font-bold text-white">Ancora nessuna news</p>
            <p className="max-w-sm text-[15px] text-slate-400">
              Quando pubblichiamo un evento o un aggiornamento lo trovi qui. Nel frattempo, il
              Discord è il posto dove succedono le cose.
            </p>
            <a
              href={SITE.discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="venrix-btn-secondary mt-2"
            >
              <IconChat className="h-4 w-4" /> Vai al Discord
            </a>
          </div>
        )}
      </section>

      <section className="relative overflow-hidden border-t border-white/10 bg-ink-900">
        <div className="pointer-events-none absolute inset-0 glow-brand" aria-hidden />
        <div
          data-build
          style={buildDelay(880)}
          className="relative mx-auto grid max-w-7xl gap-7 px-4 py-20 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-24"
        >
          {SHORTCUTS.map(({ href, icon: Icon, title, body, cta }) => (
            <Link key={href} href={href} className="venrix-card group flex flex-col p-7 sm:p-8">
              <PixelFrame className="h-14 w-14 text-venrix-200">
                <Icon className="h-6 w-6" />
              </PixelFrame>
              <h3 className="mt-6 font-display text-xl font-bold text-white">
                {title}
              </h3>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-slate-400">{body}</p>
              {/* mt-auto: i due inviti restano allineati anche se i testi
                  sopra occupano un numero di righe diverso. */}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-7 text-sm font-semibold text-venrix-300">
                {cta}
                <IconChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <DiscordCTA />
    </>
  );
}
