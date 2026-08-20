"use client";

import { useState } from "react";
import { PlayerSkinViewer } from "@/components/PlayerSkinViewer";
import { IconCopy, IconCheck } from "@/components/icons";
import { SITE } from "@/lib/constants";

const PANEL_SHADOW =
  "inset 2px 2px 0 rgba(255,255,255,0.06), inset -2px -2px 0 rgba(0,0,0,0.35), 0 3px 0 rgba(0,0,0,0.4)";

/**
 * Embedded in the hero, next to the Venrix__ skin — this is the site's one
 * and only "server name / IP / copy" widget (the hero used to also have a
 * standalone CopyIP pill, which duplicated this).
 */
export function JoinServerPanel() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(SITE.serverIp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — ignore
    }
  }

  return (
    // No pixel-corners clip-path here on purpose: it would clip the skin
    // that's meant to visually spill past the panel's bottom-right edge.
    <div
      className="relative w-full shrink-0 border-2 border-black/40 bg-ink-800 p-6 py-10 sm:w-[420px]"
      style={{ boxShadow: PANEL_SHADOW }}
    >
      <span
        className="pixel-corners-sm absolute -left-2 -top-4 -rotate-6 border-2 border-black/40 bg-venrix-600 px-2.5 py-1.5 font-display text-[9px] text-white md:-left-4"
        style={{ boxShadow: "0 3px 0 rgba(0,0,0,0.4)" }}
      >
        1.20+ - 26.2
      </span>

      <h2 className="absolute -top-1 left-20 -translate-y-full whitespace-nowrap font-display text-sm text-white sm:left-32 sm:text-lg md:left-36">
        Come entrare?
      </h2>

      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[10px] uppercase tracking-wide text-venrix-400">
            Nome Server:
          </p>
          <div className="venrix-input mt-2 font-display text-sm text-white">{SITE.name}</div>

          <p className="mt-5 font-display text-[10px] uppercase tracking-wide text-venrix-400">
            IP del server:
          </p>
          <div className="venrix-input mt-2 flex items-center justify-between gap-2 font-mono text-sm text-white">
            {SITE.serverIp}
            <button
              onClick={handleCopy}
              aria-label="Copia IP del server"
              className="pixel-corners-sm flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black/40 bg-venrix-600 text-white transition hover:bg-venrix-500"
            >
              {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Spacer reserving room for the skin, which is positioned
            absolutely against the panel below (not this div). */}
        <div className="hidden w-28 shrink-0 sm:block" />
      </div>

      <div className="pointer-events-none absolute bottom-0 right-2 hidden sm:block">
        <PlayerSkinViewer username="Lorenzzzzzz" width={150} height={190} />
      </div>
    </div>
  );
}
