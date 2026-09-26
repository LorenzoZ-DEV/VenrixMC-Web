"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import type { ComponentType } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  IconMenu,
  IconClose,
  IconHome,
  IconNewspaper,
  IconBook,
  IconShield,
  IconHammer,
  IconUsers,
  IconUserPlus,
  IconCart,
  IconGrid,
  IconChart,
  IconChat,
  type IconProps,
} from "@/components/icons";

const NAV_ICONS: Record<string, ComponentType<IconProps>> = {
  "/": IconHome,
  "/news": IconNewspaper,
  "/forum": IconChat,
  "/rules": IconBook,
  "/appeals": IconShield,
  "/bans": IconHammer,
  "/status": IconChart,
  "/staff": IconUsers,
  "/staff-apply": IconUserPlus,
};

/*
 * Nove voci su una riga sola stanno in 1280px, non in 1024: fra i due
 * l'intestazione userebbe il menu compatto. "Staff Apply" e' l'unica
 * etichetta che va accorciata per far tornare i conti; il menu compatto e
 * il footer continuano a usare la forma lunga di NAV_LINKS.
 */
const SHORT_LABELS: Record<string, string> = {
  "/staff-apply": "Apply",
};

/**
 * Una voce resta accesa anche nelle sue sottopagine: /forum/<sezione> e
 * /news/<slug> sono ancora "Forum" e "News". La Home fa eccezione, altrimenti
 * risulterebbe attiva ovunque.
 */
function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /*
   * La barra e' sempre visibile: scorrendo cambia solo quanto stacca dalla
   * pagina, perche' li' sotto le passa il contenuto e serve piu' ombra per
   * non farla sembrare appiccicata.
   */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Con il menu compatto aperto la pagina dietro non deve scorrere.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    /*
     * L'intestazione non e' piu' una fascia a tutta larghezza incollata al
     * bordo: e' una barra che galleggia, staccata dai lati e dall'alto, con
     * la pagina che le scorre sotto e attraverso. Il padding sta qui,
     * sull'elemento sticky, cosi' lo stacco dal bordo alto resta anche
     * quando la barra e' agganciata durante lo scorrimento.
     */
    <header data-build className="sticky top-0 z-40 px-3 pb-2 pt-3 sm:px-5 lg:px-8">
      <nav
        className={clsx(
          "glass mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 rounded-full pl-5 pr-3 transition-shadow duration-300",
          // In cima alla pagina la barra e' appena accennata; scorrendo
          // guadagna stacco, perche' li' sotto le passa il contenuto.
          scrolled ? "shadow-lift" : "shadow-card"
        )}
      >
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <Image
            src="/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"
            alt="VenrixMC"
            width={40}
            height={40}
            priority
            className="h-9 w-auto transition-transform duration-300 group-hover:scale-110"
          />
          <span className="font-display text-lg font-extrabold tracking-[-0.03em] text-white">
            Venrix<span className="text-venrix-500">MC</span>
          </span>
        </Link>

        {/*
          Pastiglie morbide, testo soltanto: la fila di riquadri con icona ed
          etichetta minuscola provata prima era la cosa che appesantiva di
          piu' la pagina. La voce corrente e' una pastiglia piena nel colore
          del marchio, riconoscibile senza doverla leggere.
        */}
        <div className="hidden items-center gap-0.5 xl:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                data-active={active}
                aria-current={active ? "page" : undefined}
                className="nav-pill px-3 py-2 text-[14px]"
              >
                {SHORT_LABELS[link.href] ?? link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <ThemeToggle />
          {/*
            Ingresso alla dashboard, uguale per tutti: lo staff trova i
            pannelli di gestione, gli utenti lo stato delle loro richieste.
          */}
          <Link
            href="/dashboard"
            aria-label="Dashboard"
            className="btn-base h-10 w-10 border-white/10 bg-ink-700 text-slate-200 shadow-sm hover:bg-ink-600"
          >
            <IconGrid className="h-4 w-4" />
          </Link>
          <a
            href={SITE.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="venrix-btn-primary h-10 rounded-full px-5 py-0 text-sm"
          >
            <IconCart className="h-4 w-4" />
            Store
          </a>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <ThemeToggle />
          <button
            className="btn-base h-10 w-10 border-white/10 bg-ink-700 text-slate-200 shadow-sm hover:bg-ink-600"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Chiudi il menu" : "Apri il menu"}
            aria-expanded={open}
          >
            {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass mx-auto mt-2 max-h-[calc(100dvh-104px)] max-w-7xl overflow-y-auto rounded-3xl p-3 xl:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = NAV_ICONS[link.href];
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                  className="nav-pill justify-start gap-3 px-4 py-3 text-[15px]"
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
                  {link.label}
                </Link>
              );
            })}

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="nav-pill justify-start gap-3 px-4 py-3 text-[15px]"
            >
              <IconGrid className="h-4 w-4 shrink-0 opacity-70" />
              Dashboard
            </Link>

            <a
              href={SITE.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="venrix-btn-primary mt-3 w-full rounded-full"
            >
              <IconCart className="h-4 w-4" /> Store
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
