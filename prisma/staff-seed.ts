import type { StaffRole } from "@prisma/client";

/**
 * Formazione iniziale del team, quella che prima viveva hardcoded in
 * src/lib/team.ts. Serve solo a popolare la tabella `staff_members` la prima
 * volta: da quel momento la lista si gestisce dalla dashboard e questo file
 * non viene piu letto dal sito.
 *
 * Il seed e idempotente (upsert su username), quindi rieseguirlo non crea
 * duplicati ne sovrascrive l ordine deciso dalla dashboard per membri nuovi.
 */
export const INITIAL_STAFF: {
  username: string;
  role: StaffRole;
  description: string;
  order: number;
}[] = [
  {
    username: "Venrix__",
    role: "Owner",
    order: 0,
    description:
      "Si occupa di supervisionare tutto il lato network e porta i contenuti del server in live su TikTok.",
  },
  {
    username: "Lorenzzzzzz",
    role: "Owner",
    order: 1,
    description:
      "Responsabile lato tecnico del server: gestione infrastruttura, sito, Minecraft e Discord, e risoluzione dei problemi del server.",
  },
  {
    username: "_Algi_k_",
    role: "Dev",
    order: 0,
    description:
      "Coordinatore dei Developer, si occupa del lato server VPS e del lato server Minecraft.",
  },
  {
    username: "scxveer",
    role: "Mod",
    order: 0,
    description:
      "Moderatore del server Minecraft: modera principalmente la chat e presta supporto ai player, con la passione di interagire con la community.",
  },
  {
    username: "4rror451",
    role: "Mod",
    order: 1,
    description:
      "Si occupa dei controlli hack e dei log per verificare che non ci siano cheater nel server, oltre al supporto generale.",
  },
  {
    username: "aztraaal",
    role: "Helper",
    order: 0,
    description:
      "Coordina gli Helper SS e si occupa specificamente dei controlli hack, dando la caccia a chi cerca un vantaggio sleale nel server.",
  },
  {
    username: "Asciutto_",
    role: "Helper",
    order: 1,
    description:
      "Verifica i sospetti di xray, effettua eventuali controlli hack e presta supporto prioritario ai player.",
  },
];
