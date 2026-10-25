import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { IconGrid } from "@/components/icons";

const COL_TITLE = "mono-label mb-4 block text-slate-400";
// La freccetta scorre a destra all'hover: da' un feedback di direzione che
// il solo cambio di colore non comunica.
const FOOTER_LINK =
  "inline-block text-[15px] text-slate-300 transition-[color,transform] duration-200 hover:translate-x-0.5 hover:text-venrix-200";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-ink-900">
      {/* Alone del marchio in basso: chiude la pagina invece di lasciarla
          finire su una fascia piatta. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 glow-brand opacity-70" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"
              alt="VenrixMC"
              width={36}
              height={36}
              className="h-9 w-auto"
            />
            <span className="font-display text-base font-bold text-white">
              VenrixMC
            </span>
          </div>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-400">
            Il server Minecraft dove community e avventura si incontrano. Unisciti a noi su{" "}
            <span className="font-mono text-venrix-200">{SITE.serverIp}</span>.
          </p>
        </div>

        <div>
          <h4 className={COL_TITLE}>Naviga</h4>
          <ul className="space-y-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={FOOTER_LINK}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={COL_TITLE}>Community</h4>
          <ul className="space-y-2.5">
            <li>
              <a
                href={SITE.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className={FOOTER_LINK}
              >
                Discord
              </a>
            </li>
            <li>
              <a
                href={SITE.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={FOOTER_LINK}
              >
                Store
              </a>
            </li>
            <li>
              <Link href="/dashboard" className={`${FOOTER_LINK} inline-flex items-center gap-1.5`}>
                <IconGrid className="h-3.5 w-3.5 opacity-70" />
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/5 px-4 py-5 text-center text-[13px] text-slate-500">
        <p>© {new Date().getFullYear()} VenrixMC. Non affiliato con Mojang AB.</p>
        <p className="mt-1">
          <Link href="/terms" className="transition-colors hover:text-venrix-200 hover:underline">
            Termini di Servizio
          </Link>
          {" · "}
          <Link href="/privacy" className="transition-colors hover:text-venrix-200 hover:underline">
            Privacy Policy
          </Link>
        </p>
        <p className="mt-1">
          <span className="tabular font-mono">v.{SITE.version}</span> · Sviluppato da{" "}
          <a
            href={SITE.author.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-venrix-300 transition-colors hover:text-venrix-200 hover:underline"
          >
            {SITE.author.name}
          </a>
        </p>
      </div>
    </footer>
  );
}
