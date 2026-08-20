"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { PixelLoader } from "./PixelLoader";

const MIN_VISIBLE_MS = 450;

/**
 * Shows a branded loading overlay (logo + pixel dots) while navigating
 * between pages. The App Router has no built-in "navigation started" event,
 * so we fake one: a capture-phase click listener on internal links flips
 * the overlay on immediately (before the async navigation even begins),
 * and it's hidden once the pathname actually changes — with a minimum
 * visible time so it never looks like a flicker on fast/prefetched routes.
 */
export function PageTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Note: don't gate on e.defaultPrevented — next/link always calls
      // preventDefault() to do client-side routing, so that flag is set on
      // every normal internal navigation, not just cancelled ones.
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) return;

      shownAt.current = Date.now();
      setVisible(true);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!visible) return;

    const elapsed = shownAt.current ? Date.now() - shownAt.current : MIN_VISIBLE_MS;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const timer = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-5 bg-ink-900/90 backdrop-blur-sm">
      <Image
        src="/imgs/LOGO_SENZA_SFONDO_VENRIXMC.png"
        alt=""
        width={64}
        height={64}
        className="h-16 w-auto animate-pulse"
      />
      <PixelLoader label="Caricamento" />
    </div>
  );
}
