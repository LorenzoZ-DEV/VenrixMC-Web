import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-900">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <Image
              src="/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"
              alt="VenrixMC"
              width={36}
              height={36}
              className="h-9 w-auto"
            />
            <span className="font-display text-sm text-white">VenrixMC</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-400">
            Il server Minecraft dove community e avventura si incontrano. Unisciti a noi su{" "}
            <span className="font-mono text-venrix-300">{SITE.serverIp}</span>.
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-display text-[10px] uppercase tracking-wide text-slate-400">
            Naviga
          </h4>
          <ul className="space-y-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-slate-300 hover:text-venrix-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-display text-[10px] uppercase tracking-wide text-slate-400">
            Community
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={SITE.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-venrix-300"
              >
                Discord
              </a>
            </li>
            <li>
              <a
                href={SITE.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-venrix-300"
              >
                Store
              </a>
            </li>
            <li>
              <Link href="/login" className="text-slate-300 hover:text-venrix-300">
                Staff Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} VenrixMC. Non affiliato con Mojang AB.
      </div>
    </footer>
  );
}
