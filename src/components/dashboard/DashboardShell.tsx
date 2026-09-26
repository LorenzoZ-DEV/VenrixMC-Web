"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import type { ComponentType } from "react";
import type { Role } from "@prisma/client";
import { ROLE_RANK } from "@/lib/roles";
import {
  IconChart,
  IconShield,
  IconClipboard,
  IconNewspaper,
  IconBook,
  IconUsers,
  IconUser,
  IconFileText,
  IconGear,
  IconBug,
  IconLogout,
  IconGrid,
  IconSearch,
  IconChat,
  IconMail,
  IconMenu,
  IconClose,
  IconChevronLeft,
  type IconProps,
} from "@/components/icons";

/*
 * `only`: la voce compare solo a questi ruoli, a prescindere dal rango (il
 * Capo Builder e' fuori dalla scala staff ma ha le sue candidature).
 */
type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<IconProps>;
  minRole: Role;
  only?: Role[];
};

type NavGroup = { title: string; items: NavItem[] };

/*
 * Le voci sono raggruppate per lavoro, non elencate tutte di fila.
 *
 * Erano sedici link uno sotto l'altro: per trovare "Posizioni Staff" si
 * doveva leggerli tutti, perche' niente diceva dove guardare. Un titolo di
 * gruppo ogni tre o quattro voci trasforma la lettura in una scelta fra sei
 * reparti, e i gruppi vuoti (per chi non ha i permessi) spariscono da soli.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    title: "Panoramica",
    items: [
      { href: "/dashboard", label: "Overview", icon: IconChart, minRole: "STAFF" },
      { href: "/dashboard/richieste", label: "Le mie richieste", icon: IconMail, minRole: "MEMBER" },
    ],
  },
  {
    title: "Moderazione",
    items: [
      { href: "/dashboard/appeals", label: "Ban Appeals", icon: IconShield, minRole: "STAFF" },
      { href: "/dashboard/litebans", label: "Sanzioni", icon: IconSearch, minRole: "STAFF" },
    ],
  },
  {
    title: "Candidature",
    items: [
      {
        href: "/dashboard/applications",
        label: "Candidature Builder",
        icon: IconClipboard,
        minRole: "MEMBER",
        only: ["BUILDER"],
      },
      {
        href: "/dashboard/applications",
        label: "Candidature Staff",
        icon: IconClipboard,
        minRole: "HEAD",
      },
      { href: "/dashboard/positions", label: "Posizioni", icon: IconGrid, minRole: "HEAD" },
      { href: "/dashboard/blacklist", label: "Blacklist", icon: IconShield, minRole: "HEAD" },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/dashboard/forum-members", label: "Membri forum", icon: IconChat, minRole: "HEAD" },
      { href: "/dashboard/forum", label: "Forum", icon: IconGrid, minRole: "ADMIN" },
      { href: "/dashboard/staff", label: "Lista staff", icon: IconUsers, minRole: "ADMIN" },
    ],
  },
  {
    title: "Contenuti",
    items: [
      { href: "/dashboard/news", label: "News", icon: IconNewspaper, minRole: "ADMIN" },
      { href: "/dashboard/rules", label: "Regolamento", icon: IconBook, minRole: "ADMIN" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/dashboard/users", label: "Utenti", icon: IconUser, minRole: "ADMIN" },
      { href: "/dashboard/audit-log", label: "Audit log", icon: IconFileText, minRole: "ADMIN" },
      { href: "/dashboard/settings", label: "Impostazioni", icon: IconGear, minRole: "ADMIN" },
      { href: "/debug", label: "Debug", icon: IconBug, minRole: "STAFF" },
    ],
  },
];

function visibleGroups(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.only ? item.only.includes(role) : ROLE_RANK[role] >= ROLE_RANK[item.minRole]
    ),
  })).filter((group) => group.items.length > 0);
}

export function DashboardShell({
  role,
  username,
  children,
}: {
  role: Role;
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const groups = visibleGroups(role);
  const profileHref =
    ROLE_RANK[role] >= ROLE_RANK.STAFF ? "/dashboard/profile" : "/forum/impostazioni";

  // Cambiando pagina il pannello mobile va chiuso: restare aperto sopra la
  // pagina appena aperta e' il difetto classico dei menu a scomparsa.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mono-label px-3 text-slate-500">{group.title}</p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={`${item.href}-${item.label}`}>
                  <Link
                    href={item.href}
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                    className="nav-pill w-full justify-start gap-3 px-3 py-2.5 text-[14px]"
                  >
                    <item.icon className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const account = (
    <div className="space-y-2">
      <Link
        href={profileHref}
        className="nav-pill w-full justify-start gap-3 px-2.5 py-2.5 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-venrix-600/25 font-display text-xs font-bold text-venrix-200">
          {username.slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">{username}</span>
          <span className="mono-label block text-slate-500">{role}</span>
        </span>
      </Link>
      <button onClick={logout} className="pixel-btn-ghost w-full justify-start px-3 py-2 text-sm">
        <IconLogout className="h-4 w-4" /> Esci
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-800">
      {/*
        Barra in alto, larga quanto la pagina: tiene il ritorno al sito
        pubblico (prima non c'era alcun modo di uscire dalla dashboard se
        non col tasto indietro del browser) e, sotto i 1024px, il comando
        del pannello di navigazione.
      */}
      <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-x-0 border-t-0 px-4 sm:px-6">
        <button
          onClick={() => setOpen(true)}
          aria-label="Apri la navigazione"
          aria-expanded={open}
          className="btn-base h-10 w-10 border-white/10 bg-ink-700 text-slate-200 hover:bg-ink-600 lg:hidden"
        >
          <IconMenu className="h-5 w-5" />
        </button>

        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-auto"
          />
          <span className="font-display text-base font-extrabold tracking-[-0.03em] text-white">
            Venrix<span className="text-venrix-500">MC</span>
          </span>
        </Link>

        <span className="mono-label ml-1 hidden rounded-full bg-white/8 px-2.5 py-1 text-slate-400 sm:inline">
          Dashboard
        </span>

        <Link href="/" className="nav-pill ml-auto gap-2 px-3 py-2 text-sm">
          <IconChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Torna al sito</span>
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px]">
        {/*
          La colonna e' sticky sotto la barra e scorre per conto suo: con
          sedici voci e una pagina lunga, una barra laterale che scorre con
          il contenuto porta la navigazione fuori schermo proprio quando
          serve.
        */}
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-white/10 p-4 lg:flex">
          {nav}
          <div className="pt-6">{account}</div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Pannello a scomparsa sotto i 1024px. */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Chiudi la navigazione"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="glass absolute inset-y-0 left-0 flex w-[17rem] flex-col justify-between overflow-y-auto rounded-r-3xl border-y-0 border-l-0 p-4">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display text-base font-extrabold text-white">Dashboard</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Chiudi la navigazione"
                  className="btn-base h-9 w-9 border-white/10 bg-ink-700 text-slate-200"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
              {nav}
            </div>
            <div className="pt-6">{account}</div>
          </div>
        </div>
      )}
    </div>
  );
}
