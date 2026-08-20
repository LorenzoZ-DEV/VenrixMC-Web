import type { ComponentType } from "react";
import {
  IconChat,
  IconSearch,
  IconShield,
  IconHammer,
  IconCode,
  IconUsers,
  IconBook,
  IconRocket,
  type IconProps,
} from "@/components/icons";

/** String keys stored on StaffPosition.icon, resolved to the pixel icon set client-side. */
export const STAFF_POSITION_ICONS: Record<string, ComponentType<IconProps>> = {
  chat: IconChat,
  search: IconSearch,
  shield: IconShield,
  hammer: IconHammer,
  code: IconCode,
  users: IconUsers,
  book: IconBook,
  rocket: IconRocket,
};

export const STAFF_POSITION_ICON_KEYS = Object.keys(STAFF_POSITION_ICONS);
