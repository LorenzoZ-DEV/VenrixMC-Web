"use client";

import { useLayoutEffect } from "react";

// Matches the last [data-build] delay on the homepage (880ms) plus its
// animation length, with headroom.
const SEQUENCE_DURATION_MS = 1700;

/**
 * Plays the "building" entrance (see globals.css `.venrix-building
 * [data-build]`) every time the homepage mounts — including every time you
 * navigate back to "/", not just the first visit. useLayoutEffect (not
 * useEffect) so the class is applied before the browser paints the new
 * page, avoiding a flash of the fully-built state first.
 */
export function HomeBuildTrigger() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("venrix-building");
    const timer = setTimeout(() => root.classList.remove("venrix-building"), SEQUENCE_DURATION_MS);
    return () => {
      clearTimeout(timer);
      root.classList.remove("venrix-building");
    };
  }, []);

  return null;
}
