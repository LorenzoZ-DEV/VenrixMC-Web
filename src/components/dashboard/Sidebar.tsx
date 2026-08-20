"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
  IconFileText,
  IconGear,
  IconBug,
  IconLogout,
  IconGrid,
  IconSearch,
  type IconProps,
} from "@/components/icons";

type NavItem = { href: string; label: string; icon: ComponentType<IconProps>; minRole: Role };

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: IconChart, minRole: "STAFF" },
  { href: "/dashboard/appeals", label: "Ban Appeals", icon: IconShield, minRole: "STAFF" },
  { href: "/dashboard/litebans", label: "Sanzioni (LiteBans)", icon: IconSearch, minRole: "STAFF" },
  { href: "/dashboard/applications", label: "Candidature Staff", icon: IconClipboard, minRole: "HEAD" },
  { href: "/dashboard/positions", label: "Posizioni Staff", icon: IconGrid, minRole: "HEAD" },
  { href: "/dashboard/news", label: "News", icon: IconNewspaper, minRole: "ADMIN" },
  { href: "/dashboard/rules", label: "Regolamento", icon: IconBook, minRole: "ADMIN" },
  { href: "/dashboard/users", label: "Utenti", icon: IconUsers, minRole: "ADMIN" },
  { href: "/dashboard/audit-log", label: "Audit Log", icon: IconFileText, minRole: "ADMIN" },
  { href: "/dashboard/settings", label: "Impostazioni Sito", icon: IconGear, minRole: "DEVELOPER" },
  { href: "/debug", label: "Debug Mode", icon: IconBug, minRole: "STAFF" },
];

export function Sidebar({ role, username }: { role: Role; username: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const visible = ITEMS.filter((item) => ROLE_RANK[role] >= ROLE_RANK[item.minRole]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-ink-900">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <Image
          src="/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"
          alt="VenrixMC"
          width={32}
          height={32}
          className="h-8 w-auto"
        />
        <span className="font-display text-xs text-white">VenrixMC</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visible.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              pathname === item.href
                ? "bg-venrix-600/20 text-venrix-200"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Link
          href="/dashboard/profile"
          className="mb-3 flex items-center gap-2 rounded-lg p-1 -m-1 transition hover:bg-white/5"
        >
          <div className="flex h-8 w-8 items-center justify-center bg-venrix-600/30 text-xs font-bold text-venrix-200">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{username}</p>
            <p className="text-xs text-slate-400">{role}</p>
          </div>
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
        >
          <IconLogout className="h-4 w-4" /> Esci
        </button>
      </div>
    </aside>
  );
}
