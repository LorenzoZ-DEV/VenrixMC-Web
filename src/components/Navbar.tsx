"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import type { ComponentType } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import {
  IconMenu,
  IconClose,
  IconHome,
  IconNewspaper,
  IconBook,
  IconShield,
  IconUsers,
  IconUserPlus,
  IconCart,
  type IconProps,
} from "@/components/icons";

const NAV_ICONS: Record<string, ComponentType<IconProps>> = {
  "/": IconHome,
  "/news": IconNewspaper,
  "/rules": IconBook,
  "/appeals": IconShield,
  "/staff": IconUsers,
  "/staff-apply": IconUserPlus,
};

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header data-build className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"
            alt="VenrixMC"
            width={40}
            height={40}
            className="h-10 w-auto"
            priority
          />
          <span className="font-display text-sm text-white">
            Venrix<span className="text-venrix-400">MC</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const Icon = NAV_ICONS[link.href];
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "group flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition",
                  pathname === link.href
                    ? "bg-venrix-600/20 text-venrix-200"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                {Icon && (
                  <Icon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:animate-bounce group-hover:text-venrix-300" />
                )}
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:block">
          <a
            href={SITE.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="venrix-btn-primary group"
          >
            <IconCart className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:animate-bounce" />
            Store
          </a>
        </div>

        <button
          className="p-2 text-slate-200 hover:bg-white/10 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-ink-900 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = NAV_ICONS[link.href];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium",
                    pathname === link.href
                      ? "bg-venrix-600/20 text-venrix-200"
                      : "text-slate-300 hover:bg-white/5"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {link.label}
                </Link>
              );
            })}
            <a
              href={SITE.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="venrix-btn-primary mt-2"
            >
              <IconCart className="h-4 w-4" /> Store
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
