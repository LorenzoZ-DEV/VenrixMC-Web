import Image from "next/image";
import { getDiscordWidget } from "@/lib/discord";
import { SITE } from "@/lib/constants";
import { IconChat } from "@/components/icons";

// Subtle repeating "plus" texture — keeps the solid brand-purple band from
// reading as a flat color block without competing with the mascot artwork.
const PLUS_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

export async function DiscordCTA() {
  const widget = await getDiscordWidget();

  return (
    <section className="relative overflow-hidden bg-venrix-700">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.15]"
        style={{ backgroundImage: PLUS_PATTERN, backgroundSize: "24px 24px" }}
      />
      {/* Luce radiale dietro il testo invece della sola sfumatura verso il
          basso: il fondo brand pieno smette di leggersi come tinta unita. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 90% at 22% 20%, rgb(255 255 255 / 0.16), transparent 62%)",
        }}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/25" />

      <div className="relative mx-auto flex max-w-6xl flex-col-reverse items-center gap-8 px-4 py-16 text-center sm:px-6 lg:flex-row lg:justify-between lg:text-left lg:px-8">
        <div>
          <h2 className="font-display text-3xl font-bold text-onbrand sm:text-[40px] sm:leading-[1.08]">
            Unisciti al nostro Discord
          </h2>
          <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-onbrand/85">
            {widget.enabled ? (
              <>
                <span className="tabular font-semibold text-onbrand">{widget.presenceCount}</span>{" "}
                membri online in questo momento.
              </>
            ) : (
              "Chatta con la community, resta aggiornato sugli eventi e parla direttamente con lo staff."
            )}
          </p>
          {/*
            Questa fascia ha un fondo brand pieno in entrambi i temi, quindi
            testo e pulsante usano il bianco vero (onbrand) e il magenta scuro,
            non i token che si invertono passando da chiaro a scuro.
          */}
          <a
            href={SITE.discordInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-base mt-8 bg-onbrand px-7 py-3.5 text-[17px] font-bold text-venrix-800 hover:bg-white"
          >
            <IconChat className="h-4 w-4" /> Entra nel Discord
          </a>
        </div>

        <Image
          src="/imgs/discord.png"
          alt=""
          width={240}
          height={240}
          className="h-40 w-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)] sm:h-48"
        />
      </div>
    </section>
  );
}
