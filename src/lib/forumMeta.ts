import type { ComponentType } from "react";
import type { ForumReactionType } from "@prisma/client";
import {
  IconChat,
  IconNewspaper,
  IconShield,
  IconBook,
  IconHammer,
  IconUsers,
  IconCode,
  IconRocket,
  IconGear,
  IconBug,
  IconClipboard,
  IconGrid,
  IconSearch,
  IconTerminal,
  type IconProps,
} from "@/components/icons";

/**
 * Aspetto del forum: icone dei board, colori delle etichette e reazioni.
 * Sta tutto qui perche nel database restano solo chiavi ("chat", "amber",
 * "LIKE") e il resto e codice, come gia succede per i rank in lib/team.ts.
 *
 * Le classi Tailwind sono scritte per esteso di proposito: comporle con un
 * template (`bg-${color}-500/15`) le renderebbe invisibili allo scanner e
 * finirebbero eliminate dal CSS finale.
 */

/** Icona mostrata accanto al nome di un forum. Chiave in ForumBoard.icon. */
export const FORUM_BOARD_ICONS: Record<string, ComponentType<IconProps>> = {
  chat: IconChat,
  news: IconNewspaper,
  shield: IconShield,
  book: IconBook,
  hammer: IconHammer,
  users: IconUsers,
  code: IconCode,
  rocket: IconRocket,
  gear: IconGear,
  bug: IconBug,
  clipboard: IconClipboard,
  grid: IconGrid,
  search: IconSearch,
  terminal: IconTerminal,
};

export const FORUM_BOARD_ICON_KEYS = Object.keys(FORUM_BOARD_ICONS);

export function boardIcon(key: string): ComponentType<IconProps> {
  return FORUM_BOARD_ICONS[key] ?? IconChat;
}

/** Tinte disponibili per le etichette. Chiave in ForumTag.color. */
export const FORUM_TAG_COLORS: Record<string, { label: string; className: string; dot: string }> = {
  venrix: {
    label: "Viola",
    className: "border-venrix-500/35 bg-venrix-600/15 text-venrix-200",
    dot: "bg-venrix-500",
  },
  red: {
    label: "Rosso",
    className: "border-red-500/35 bg-red-500/15 text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
  amber: {
    label: "Ambra",
    className: "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  emerald: {
    label: "Verde",
    className: "border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  sky: {
    label: "Azzurro",
    className: "border-sky-500/35 bg-sky-500/15 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  indigo: {
    label: "Indaco",
    className: "border-indigo-500/35 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  rose: {
    label: "Rosa",
    className: "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  slate: {
    label: "Grigio",
    className: "border-white/15 bg-white/10 text-slate-300",
    dot: "bg-slate-400",
  },
};

export const FORUM_TAG_COLOR_KEYS = Object.keys(FORUM_TAG_COLORS);

export function tagColor(key: string) {
  return FORUM_TAG_COLORS[key] ?? FORUM_TAG_COLORS.slate;
}

/** Reazioni ai post: emoji e didascalia del tooltip. */
export const FORUM_REACTIONS: Record<ForumReactionType, { emoji: string; label: string }> = {
  LIKE: { emoji: "👍", label: "Mi piace" },
  LOVE: { emoji: "❤️", label: "Adoro" },
  LAUGH: { emoji: "😄", label: "Divertente" },
  AGREE: { emoji: "✅", label: "Quoto" },
};

export const FORUM_REACTION_KEYS = Object.keys(FORUM_REACTIONS) as ForumReactionType[];
