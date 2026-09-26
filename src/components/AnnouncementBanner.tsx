import Link from "next/link";
import { getAnnouncement, type AnnouncementKind } from "@/lib/siteStatus";

const KIND_STYLE: Record<AnnouncementKind, { bar: string; label: string }> = {
  maintenance: {
    bar: "bg-amber-500 text-black",
    label: "Manutenzione",
  },
  incident: {
    bar: "bg-red-600 text-onbrand",
    label: "Incidente tecnico",
  },
  info: {
    bar: "bg-sky-600 text-onbrand",
    label: "Avviso",
  },
};

/**
 * Barra d'annuncio sopra la navbar, visibile su tutte le pagine quando
 * abilitata dalla dashboard (manutenzione programmata o incidente tecnico).
 * Server component: legge l'impostazione cachata, niente JS client.
 */
export async function AnnouncementBanner() {
  const announcement = await getAnnouncement();
  if (!announcement.enabled || !announcement.message.trim()) return null;

  const style = KIND_STYLE[announcement.kind];

  return (
    <div className={`${style.bar}`}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[13px] font-semibold sm:px-6 lg:px-8">
        <span className="rounded-sm bg-black/25 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]">
          {style.label}
        </span>
        <span>{announcement.message}</span>
        <Link href="/status" className="underline underline-offset-2 hover:opacity-80">
          Vedi stato
        </Link>
      </div>
    </div>
  );
}
