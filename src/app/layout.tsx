import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { Navbar } from "@/components/Navbar";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

/*
 * I font sono SELF-HOSTED, non presi da next/font/google.
 *
 * Il motivo e' concreto: `next/font/google` li scarica da fonts.gstatic.com
 * durante il build, e il build di produzione gira sul VPS. Quando da li'
 * gstatic non risponde, Next non fallisce: ripiega in silenzio sui font di
 * sistema, e il deploy va a buon fine servendo la tipografia sbagliata.
 * E' successo davvero, e dal sito non si vedeva: il build era "verde".
 *
 * Questi tre sono i file variabili: un file per famiglia copre tutti i pesi,
 * 100 KB in tutto per l'intera tipografia del sito. Sono font con licenza
 * libera (OFL), quindi l'auto-hosting e' previsto dalla licenza.
 */

// Titoli. Terminali leggermente arrotondati e contatori aperti: legge
// amichevole senza diventare infantile.
const displayFont = localFont({
  src: "../fonts/jakarta.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-display",
  display: "swap",
  // Il fallback ha le metriche riallineate a quelle del font vero, cosi' il
  // testo non "salta" quando il woff2 finisce di caricare.
  adjustFontFallback: "Arial",
});

// Testo corrente: regge i paragrafi lunghi di news, regolamento e forum.
const bodyFont = localFont({
  src: "../fonts/outfit.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: "Arial",
});

/*
 * Dati: IP, versioni, conteggi, ID. Cifre a larghezza fissa e zero sbarrato,
 * che su un indirizzo evita l'ambiguita' fra 0 e O.
 */
const monoFont = localFont({
  src: "../fonts/jetbrains.woff2",
  weight: "100 800",
  style: "normal",
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://venrixmc.uk";
/*
 * La descrizione fa lavoro vero: dice l'edizione, l'indirizzo per esteso e
 * cosa si trova sul sito. "Unisciti al server" da solo non dice niente a
 * chi la legge nei risultati di ricerca o nell'anteprima su Discord.
 */
const DESCRIPTION =
  "Server Minecraft italiano su Java 1.20+. IP: play.venrixmc.uk. Community, eventi, staff presente, regolamento chiaro e forum.";

export const metadata: Metadata = {
  // Senza metadataBase Next risolve gli URL social come relativi e
  // Discord/Telegram non trovano l'immagine di anteprima.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VenrixMC, server Minecraft italiano",
    // Le sottopagine passano solo il proprio nome e il suffisso arriva da qui.
    template: "%s · VenrixMC",
  },
  description: DESCRIPTION,
  applicationName: "VenrixMC",
  keywords: ["Minecraft", "server Minecraft", "VenrixMC", "survival", "community italiana"],
  icons: { icon: "/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png" },
  openGraph: {
    type: "website",
    siteName: "VenrixMC",
    locale: "it_IT",
    url: SITE_URL,
    title: "VenrixMC, server Minecraft italiano",
    description: DESCRIPTION,
    images: [{ url: "/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png", width: 512, height: 512, alt: "VenrixMC" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VenrixMC, server Minecraft italiano",
    description: DESCRIPTION,
    images: ["/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"],
  },
};

export const viewport: Viewport = {
  // Il colore della barra del browser su mobile segue il tema della pagina.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#17121c" },
  ],
};

/*
 * Applica il tema salvato prima che il browser dipinga il primo frame,
 * altrimenti la pagina lampeggia nel tema sbagliato a ogni caricamento.
 * Deve restare uno script inline sincrono in <head>: qualsiasi altra
 * collocazione arriva troppo tardi.
 */
const themeBootstrap = `try{document.documentElement.dataset.theme=localStorage.getItem("theme")||"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      // Lo scuro e' il default: e' la palette su cui il magenta del
      // marchio rende meglio. Il chiaro resta disponibile dal toggle.
      data-theme="dark"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="flex min-h-screen flex-col">
        {/*
          Prima voce raggiungibile col Tab: senza, chi naviga da tastiera
          deve attraversare tutte le voci del menu a ogni pagina.
        */}
        <a href="#contenuto" className="skip-link">
          Salta al contenuto
        </a>
        <Suspense fallback={null}>
          <PageTransition />
        </Suspense>
        <AnnouncementBanner />
        <Navbar />
        <main id="contenuto" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
