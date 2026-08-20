"use client";

import { useEffect, useRef, useState } from "react";
import { PixelLoader } from "./PixelLoader";

const SKIN_URL = (username: string) => `https://minotar.net/skin/${encodeURIComponent(username)}`;

/**
 * Renders an animated 3D Minecraft skin (skinview3d/three.js) that waves at
 * visitors — used as a homepage mascot. Loaded lazily/client-only since it
 * needs WebGL; degrades to a loading state or a quiet fallback if the skin
 * can't be fetched instead of breaking the page.
 */
export function PlayerSkinViewer({
  username,
  className,
  width = 220,
  height = 280,
}: {
  username: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let disposed = false;
    let viewer: import("skinview3d").SkinViewer | null = null;

    (async () => {
      const skinview3d = await import("skinview3d");
      if (disposed || !containerRef.current) return;

      viewer = new skinview3d.SkinViewer({
        width,
        height,
        zoom: 0.8,
      });
      containerRef.current.appendChild(viewer.canvas);
      viewer.autoRotate = false;
      viewer.controls.enableRotate = false;
      viewer.controls.enableZoom = false;
      viewer.controls.enablePan = false;

      try {
        await viewer.loadSkin(SKIN_URL(username));
        if (disposed) return;
        viewer.animation = new skinview3d.WaveAnimation();
        setStatus("ready");
      } catch {
        if (!disposed) setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      viewer?.dispose();
    };
  }, [username, width, height]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <PixelLoader />
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center text-center text-xs text-slate-500">
            Skin non disponibile
          </div>
        )}
      </div>
    </div>
  );
}
