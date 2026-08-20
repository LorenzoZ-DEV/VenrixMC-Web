/**
 * Small hand-drawn icon set (square line caps/joins, no rounding) used
 * across the site instead of emoji — keeps a consistent, deliberately
 * blocky feel in line with the pixel-art theme rather than relying on a
 * generic icon library.
 */
import { SVGProps, CSSProperties } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};

export function IconHome(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z" />
    </svg>
  );
}

export function IconBook(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4V4z" />
      <path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6V4z" />
    </svg>
  );
}

export function IconNewspaper(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="14" height="15" />
      <rect x="17" y="9" width="4" height="7" />
      <line x1="6" y1="8" x2="12" y2="8" />
      <line x1="6" y1="11" x2="14" y2="11" />
      <line x1="6" y1="14" x2="14" y2="14" />
      <line x1="6" y1="17" x2="10" y2="17" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M3 20v-1c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5v1" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15 20v-1c0-2 1.6-3.7 3.7-4.2" />
    </svg>
  );
}

export function IconUserPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20v-1c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5v1" />
      <line x1="18" y1="6" x2="18" y2="12" />
      <line x1="15" y1="9" x2="21" y2="9" />
    </svg>
  );
}

export function IconChat(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h16v10H9l-4 4v-4H4V5z" />
      <line x1="7" y1="9" x2="15" y2="9" />
      <line x1="7" y1="12" x2="12" y2="12" />
    </svg>
  );
}

export function IconCart(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 4h2l2.4 11h10.2L20 8H7" />
      <rect x="8" y="19" width="2" height="2" />
      <rect x="16" y="19" width="2" height="2" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <line x1="4" y1="20" x2="4" y2="10" />
      <line x1="10" y1="20" x2="10" y2="4" />
      <line x1="16" y1="20" x2="16" y2="13" />
      <line x1="2" y1="20" x2="20" y2="20" />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" />
      <path d="M3 6l9 7 9-7" />
    </svg>
  );
}

export function IconClipboard(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="4" width="14" height="17" />
      <rect x="9" y="2.5" width="6" height="3" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="16" y2="15" />
    </svg>
  );
}

export function IconFileText(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h9l4 4v14H6V3z" />
      <path d="M15 3v4h4" />
      <line x1="9" y1="12" x2="16" y2="12" />
      <line x1="9" y1="15" x2="16" y2="15" />
      <line x1="9" y1="18" x2="13" y2="18" />
    </svg>
  );
}

export function IconGear(props: IconProps) {
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180;
    return {
      x1: 12 + Math.cos(angle) * 7.5,
      y1: 12 + Math.sin(angle) * 7.5,
      x2: 12 + Math.cos(angle) * 10,
      y2: 12 + Math.sin(angle) * 10,
    };
  });
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="12" cy="12" r="7.5" />
      {teeth.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
      ))}
    </svg>
  );
}

export function IconBug(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="8" width="8" height="11" />
      <line x1="12" y1="4" x2="12" y2="8" />
      <line x1="9" y1="2" x2="10.5" y2="4" />
      <line x1="15" y1="2" x2="13.5" y2="4" />
      <line x1="8" y1="11" x2="3" y2="9" />
      <line x1="16" y1="11" x2="21" y2="9" />
      <line x1="8" y1="14" x2="3" y2="14" />
      <line x1="16" y1="14" x2="21" y2="14" />
      <line x1="8" y1="17" x2="3" y2="19" />
      <line x1="16" y1="17" x2="21" y2="19" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4H5v16h4" />
      <line x1="20" y1="12" x2="10" y2="12" />
      <path d="M16 8l4 4-4 4" />
    </svg>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h4l11-11-4-4L4 16v4z" />
      <line x1="14" y1="6" x2="18" y2="10" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 7h14" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function IconHammer(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 7l3-3 4 4-3 3" />
      <path d="M13.5 7.5l3 3L6 21H3v-3L13.5 7.5z" />
    </svg>
  );
}

export function IconCode(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 8l-5 4 5 4" />
      <path d="M15 8l5 4-5 4" />
    </svg>
  );
}

export function IconRocket(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2c3 2 4.5 5.5 4.5 9.5S14 19 12 21c-2-2-4.5-5-4.5-9.5S9 4 12 2z" />
      <circle cx="12" cy="10" r="1.7" />
      <path d="M7.5 15.5L4 19l4-1" />
      <path d="M16.5 15.5L20 19l-4-1" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" />
    </svg>
  );
}

export function IconGrid(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="8" height="8" />
      <rect x="13" y="3" width="8" height="8" />
      <rect x="3" y="13" width="8" height="8" />
      <rect x="13" y="13" width="8" height="8" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20v-1c0-3.3 3.6-6 8-6s8 2.7 8 6v1" />
    </svg>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="9" width="12" height="12" />
      <path d="M6 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export function IconDot(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="9" width="6" height="6" />
    </svg>
  );
}

/** Small isometric cube — decorative motif, not a functional icon. */
export function MinecraftCube({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox="0 0 40 46" className={className} style={style} aria-hidden="true">
      <polygon points="20,0 40,11 20,22 0,11" fill="currentColor" opacity="0.9" />
      <polygon points="0,11 20,22 20,46 0,35" fill="currentColor" opacity="0.55" />
      <polygon points="40,11 20,22 20,46 40,35" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

/** Minecraft-slot style frame: stepped corners + inset bevel around an icon. */
export function PixelFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "pixel-corners-sm flex shrink-0 items-center justify-center border-2 border-black/40 bg-ink-900 " +
        (className ?? "h-11 w-11")
      }
      style={{
        boxShadow:
          "inset 2px 2px 0 rgba(255,255,255,0.06), inset -2px -2px 0 rgba(0,0,0,0.5)",
      }}
    >
      {children}
    </div>
  );
}
