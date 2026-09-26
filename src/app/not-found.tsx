import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SITE, NAV_LINKS } from "@/lib/constants";
import { IconChat, IconChevronRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Pagina non trovata",
};

// Le voci piu' plausibili per chi e' finito qui da un link vecchio o da una
// URL scritta a mano. Non tutte le nove del menu: una lista corta si legge,
// una lunga rimanda solo il problema.
const SUGGESTED = ["/", "/news", "/rules", "/forum"];

export default function NotFound() {
  const shortcuts = NAV_LINKS.filter((link) => SUGGESTED.includes(link.href));

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 glow-brand" aria-hidden />
      <div className="absolute inset-0 bg-venrix-radial" aria-hidden />

      <div className="relative mx-auto flex min-h-[70dvh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <span className="surface-inset flex h-20 w-20 items-center justify-center">
          <Image
            src="/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"
            alt=""
            width={96}
            height={96}
            className="h-12 w-auto"
          />
        </span>

        <p className="tabular mt-8 font-display text-[72px] font-bold leading-none text-venrix-500 sm:text-[104px]">
          404
        </p>

        <h1 className="display-title mt-5 text-[30px] sm:text-[42px]">
          Questa pagina non esiste
        </h1>

        <p className="mt-5 max-w-[50ch] text-[17px] leading-relaxed text-slate-400">
          Il link potrebbe essere vecchio, oppure la pagina è stata spostata. Da qui puoi tornare
          indietro senza perdere il filo.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="venrix-btn-primary">
            Torna alla home
          </Link>
          <a
            href={SITE.discordInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="venrix-btn-secondary"
          >
            <IconChat className="h-4 w-4" /> Chiedi sul Discord
          </a>
        </div>

        <nav aria-label="Pagine principali" className="mt-14 w-full">
          <p className="section-eyebrow justify-center">Oppure vai a</p>
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {shortcuts.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-pill h-11 gap-2 px-4 text-sm font-medium"
                >
                  {link.label}
                  <IconChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
