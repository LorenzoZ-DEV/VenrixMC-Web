import type { ComponentType } from "react";
import { IconShield, IconCode, IconHammer, IconUserPlus, type IconProps } from "@/components/icons";

export type StaffRole = "Owner" | "Developer" | "Mod" | "Helper";

export const ROLE_ORDER: StaffRole[] = ["Owner", "Developer", "Mod", "Helper"];

export const ROLE_META: Record<
  StaffRole,
  {
    badgeClass: string;
    barClass: string;
    glow: string;
    tagline: string;
    icon: ComponentType<IconProps>;
  }
> = {
  Owner: {
    badgeClass: "border-red-800/60 bg-red-600 text-white",
    barClass: "bg-red-600",
    glow: "radial-gradient(circle, rgba(220,38,38,0.45), transparent 70%)",
    tagline: "I fondatori del server",
    icon: IconShield,
  },
  Developer: {
    badgeClass: "border-sky-700/40 bg-sky-400 text-ink-900",
    barClass: "bg-sky-400",
    glow: "radial-gradient(circle, rgba(56,189,248,0.45), transparent 70%)",
    tagline: "Sviluppano e mantengono l'infrastruttura",
    icon: IconCode,
  },
  Mod: {
    badgeClass: "border-orange-800/60 bg-orange-600 text-white",
    barClass: "bg-orange-600",
    glow: "radial-gradient(circle, rgba(234,88,12,0.45), transparent 70%)",
    tagline: "Moderano il server e la community",
    icon: IconHammer,
  },
  Helper: {
    badgeClass: "border-emerald-800/60 bg-emerald-600 text-white",
    barClass: "bg-emerald-600",
    glow: "radial-gradient(circle, rgba(5,150,105,0.45), transparent 70%)",
    tagline: "Supportano i player ogni giorno",
    icon: IconUserPlus,
  },
};

export type StaffMember = {
  username: string;
  role: StaffRole;
  description: string;
};

export const STAFF_TEAM: StaffMember[] = [
  {
    username: "Venrix__",
    role: "Owner",
    description:
      "Si occupa di supervisionare tutto il lato network e porta i contenuti del server in live su TikTok.",
  },
  {
    username: "Lorenzzzzzz",
    role: "Owner",
    description:
      "Responsabile lato tecnico del server: gestione infrastruttura, sito, Minecraft e Discord, e risoluzione dei problemi del server.",
  },
  {
    username: "_Algi_k_",
    role: "Developer",
    description: "Coordinatore dei Developer, si occupa del lato server VPS e del lato server Minecraft.",
  },
  {
    username: "scxveer",
    role: "Mod",
    description:
      "Moderatore del server Minecraft: modera principalmente la chat e presta supporto ai player, con la passione di interagire con la community.",
  },
  {
    username: "4rror451",
    role: "Mod",
    description:
      "Si occupa dei controlli hack e dei log per verificare che non ci siano cheater nel server, oltre al supporto generale.",
  },
  {
    username: "aztraaal",
    role: "Helper",
    description:
      "Coordina gli Helper SS e si occupa specificamente dei controlli hack, dando la caccia a chi cerca un vantaggio sleale nel server.",
  },
  {
    username: "Asciutto_",
    role: "Helper",
    description:
      "Verifica i sospetti di xray, effettua eventuali controlli hack e presta supporto prioritario ai player.",
  },
];
