import type { Metadata } from "next";
import { Suspense } from "react";
import { Press_Start_2P, Manrope } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

// Blocky pixel font for headings/UI chrome — evokes Minecraft's own in-game
// font without redistributing Mojang's proprietary typeface.
const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Readable body font — kept plain on purpose so long-form text (news,
// rules, forms) stays comfortable at small sizes.
const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VenrixMC — Server Minecraft",
  description:
    "VenrixMC: unisciti al server su play.venrixmc.uk. News, community, staff e regolamento.",
  icons: { icon: "/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      className={`${pixelFont.variable} ${bodyFont.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <Suspense fallback={null}>
          <PageTransition />
        </Suspense>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
