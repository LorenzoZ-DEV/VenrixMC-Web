import type { ComponentType } from "react";
import type { StaffRole } from "@prisma/client";
import {
  IconShield,
  IconCode,
  IconHammer,
  IconUserPlus,
  IconUser,
  IconGear,
  IconKey,
  type IconProps,
} from "@/components/icons";

/**
 * Aspetto dei rank dello staff. I dati dei membri stanno nel database
 * (model StaffMember) e si modificano dalla dashboard; qui resta solo cio che
 * e codice: etichetta, colore, icona e didascalia di ogni rank.
 *
 * `StaffRole` arriva dall enum Prisma, quindi aggiungere un rank allo schema
 * senza aggiungerlo a ROLE_META e ROLE_ORDER diventa un errore di tipo invece
 * che una scheda senza colori scoperta in produzione.
 *
 * Le classi Tailwind sono scritte per esteso di proposito: costruirle con un
 * template (`bg-${hue}-700`) le renderebbe invisibili allo scanner e finirebbero
 * eliminate dal CSS finale.
 */
export type { StaffRole };

/** Dal piu alto al piu basso: e anche l ordine in cui /staff impagina i gruppi. */
export const ROLE_ORDER: StaffRole[] = [
  "Owner",
  "SrDev",
  "Dev",
  "JrDev",
  "Manager",
  "SrAdmin",
  "Admin",
  "SrMod",
  "ModPlus",
  "Mod",
  "SrHelper",
  "Helper",
  "Trainee",
  "Builder",
];

export const ROLE_META: Record<
  StaffRole,
  {
    /** Come va scritto a schermo: l enum non puo contenere il "+" di Mod+. */
    label: string;
    badgeClass: string;
    barClass: string;
    glow: string;
    tagline: string;
    icon: ComponentType<IconProps>;
  }
> = {
  Owner: {
    label: "Owner",
    badgeClass: "border-red-900/60 bg-red-700 text-onbrand",
    barClass: "bg-red-700",
    glow: "radial-gradient(circle, rgba(185,28,28,0.45), transparent 70%)",
    tagline: "I fondatori del server",
    icon: IconShield,
  },

  SrDev: {
    label: "SrDev",
    badgeClass: "border-indigo-950/60 bg-indigo-800 text-onbrand",
    barClass: "bg-indigo-800",
    glow: "radial-gradient(circle, rgba(55,48,163,0.45), transparent 70%)",
    tagline: "Guidano lo sviluppo del network",
    icon: IconCode,
  },
  Dev: {
    label: "Dev",
    badgeClass: "border-indigo-900/60 bg-indigo-700 text-onbrand",
    barClass: "bg-indigo-700",
    glow: "radial-gradient(circle, rgba(67,56,202,0.45), transparent 70%)",
    tagline: "Sviluppano e mantengono l'infrastruttura",
    icon: IconCode,
  },
  JrDev: {
    label: "JrDev",
    badgeClass: "border-indigo-800/60 bg-indigo-600 text-onbrand",
    barClass: "bg-indigo-600",
    glow: "radial-gradient(circle, rgba(79,70,229,0.45), transparent 70%)",
    tagline: "Sviluppatori in crescita nel team",
    icon: IconCode,
  },

  Manager: {
    label: "Manager",
    badgeClass: "border-rose-900/60 bg-rose-700 text-onbrand",
    barClass: "bg-rose-700",
    glow: "radial-gradient(circle, rgba(190,18,60,0.45), transparent 70%)",
    tagline: "Coordinano lo staff e le attivita del network",
    icon: IconGear,
  },

  SrAdmin: {
    label: "SrAdmin",
    badgeClass: "border-orange-950/60 bg-orange-800 text-onbrand",
    barClass: "bg-orange-800",
    glow: "radial-gradient(circle, rgba(154,52,18,0.45), transparent 70%)",
    tagline: "Supervisionano l'amministrazione del server",
    icon: IconKey,
  },
  Admin: {
    label: "Admin",
    badgeClass: "border-orange-900/60 bg-orange-700 text-onbrand",
    barClass: "bg-orange-700",
    glow: "radial-gradient(circle, rgba(194,65,12,0.45), transparent 70%)",
    tagline: "Amministrano server e community",
    icon: IconKey,
  },

  SrMod: {
    label: "SrMod",
    badgeClass: "border-cyan-950/60 bg-cyan-800 text-onbrand",
    barClass: "bg-cyan-800",
    glow: "radial-gradient(circle, rgba(21,94,117,0.45), transparent 70%)",
    tagline: "Guidano il team di moderazione",
    icon: IconHammer,
  },
  ModPlus: {
    label: "Mod+",
    badgeClass: "border-cyan-900/60 bg-cyan-700 text-onbrand",
    barClass: "bg-cyan-700",
    glow: "radial-gradient(circle, rgba(14,116,144,0.45), transparent 70%)",
    tagline: "Moderatori con permessi estesi",
    icon: IconHammer,
  },
  Mod: {
    label: "Mod",
    badgeClass: "border-cyan-800/60 bg-cyan-600 text-onbrand",
    barClass: "bg-cyan-600",
    glow: "radial-gradient(circle, rgba(8,145,178,0.45), transparent 70%)",
    tagline: "Moderano il server e la community",
    icon: IconHammer,
  },

  SrHelper: {
    label: "SrHelper",
    badgeClass: "border-emerald-950/60 bg-emerald-800 text-onbrand",
    barClass: "bg-emerald-800",
    glow: "radial-gradient(circle, rgba(6,95,70,0.45), transparent 70%)",
    tagline: "Coordinano gli Helper e i controlli",
    icon: IconUserPlus,
  },
  Helper: {
    label: "Helper",
    badgeClass: "border-emerald-900/60 bg-emerald-700 text-onbrand",
    barClass: "bg-emerald-700",
    glow: "radial-gradient(circle, rgba(4,120,87,0.45), transparent 70%)",
    tagline: "Supportano i player ogni giorno",
    icon: IconUserPlus,
  },

  Trainee: {
    label: "Trainee",
    badgeClass: "border-zinc-800/60 bg-zinc-600 text-onbrand",
    barClass: "bg-zinc-600",
    glow: "radial-gradient(circle, rgba(82,82,91,0.45), transparent 70%)",
    tagline: "In prova: i primi passi dentro lo staff",
    icon: IconUser,
  },

  Builder: {
    label: "Builder",
    badgeClass: "border-amber-900/60 bg-amber-700 text-onbrand",
    barClass: "bg-amber-700",
    glow: "radial-gradient(circle, rgba(180,83,9,0.45), transparent 70%)",
    tagline: "Costruiscono spawn, mappe ed eventi",
    icon: IconHammer,
  },
};

/** Forma di un membro come lo consuma la pagina pubblica /staff. */
export type StaffMemberData = {
  id: string;
  username: string;
  role: StaffRole;
  description: string;
  order: number;
  visible: boolean;
};
