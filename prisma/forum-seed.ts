import type { Role } from "@prisma/client";

/**
 * Struttura iniziale del forum: categorie, sezioni ed etichette con cui il
 * forum nasce gia utilizzabile invece che vuoto. Serve solo la prima volta —
 * da li in poi tutto si gestisce da /dashboard/forum e questo file non viene
 * piu letto dal sito.
 *
 * Il seed e idempotente (upsert sullo slug), quindi rieseguirlo non crea
 * doppioni ne sovrascrive le modifiche fatte dalla dashboard.
 */

export const INITIAL_FORUM_TAGS: {
  slug: string;
  name: string;
  color: string;
  description: string;
  order: number;
  staffOnly: boolean;
}[] = [
  {
    slug: "annuncio",
    name: "Annuncio",
    color: "red",
    description: "Comunicazioni ufficiali dello staff.",
    order: 0,
    staffOnly: true,
  },
  {
    slug: "risolto",
    name: "Risolto",
    color: "emerald",
    description: "La richiesta ha ricevuto una risposta definitiva.",
    order: 1,
    staffOnly: true,
  },
  {
    slug: "in-lavorazione",
    name: "In lavorazione",
    color: "amber",
    description: "Lo staff ci sta lavorando.",
    order: 2,
    staffOnly: true,
  },
  {
    slug: "accettato",
    name: "Accettato",
    color: "emerald",
    description: "La proposta o richiesta è stata accettata dallo staff.",
    order: 3,
    staffOnly: true,
  },
  {
    slug: "rifiutato",
    name: "Rifiutato",
    color: "red",
    description: "La proposta o richiesta è stata rifiutata dallo staff.",
    order: 3,
    staffOnly: true,
  },
  {
    slug: "domanda",
    name: "Domanda",
    color: "sky",
    description: "Una richiesta di aiuto o un dubbio.",
    order: 3,
    staffOnly: false,
  },
  {
    slug: "bug",
    name: "Bug",
    color: "rose",
    description: "Segnalazione di un malfunzionamento.",
    order: 4,
    staffOnly: false,
  },
  {
    slug: "proposta",
    name: "Proposta",
    color: "indigo",
    description: "Un'idea per migliorare il server.",
    order: 5,
    staffOnly: false,
  },
  {
    slug: "guida",
    name: "Guida",
    color: "venrix",
    description: "Tutorial e spiegazioni scritte dalla community.",
    order: 6,
    staffOnly: false,
  },
];

export const INITIAL_FORUM: {
  slug: string;
  name: string;
  description: string;
  order: number;
  boards: {
    slug: string;
    name: string;
    description: string;
    icon: string;
    order: number;
    locked?: boolean;
    /** Nullo = aperto a tutti / a ogni membro loggato. */
    readRole?: Role;
    postRole?: Role;
  }[];
}[] = [
  {
    slug: "venrixmc",
    name: "VenrixMC",
    description: "Tutto quello che riguarda il network",
    order: 0,
    boards: [
      {
        slug: "annunci",
        name: "Annunci",
        description:
          "Aggiornamenti, eventi e comunicazioni ufficiali. Solo lo staff apre discussioni qui.",
        icon: "news",
        order: 0,
        postRole: "STAFF",
      },
      {
        slug: "regolamento",
        name: "Regolamento",
        description: "Le regole del server e del Discord, con le relative spiegazioni.",
        icon: "book",
        order: 1,
        locked: true,
      },
      {
        slug: "presentazioni",
        name: "Presentazioni",
        description: "Sei nuovo? Presentati alla community e facci sapere chi sei.",
        icon: "users",
        order: 2,
      },
    ],
  },
  {
    slug: "community",
    name: "Community",
    description: "Lo spazio dei giocatori",
    order: 1,
    boards: [
      {
        slug: "discussioni-generali",
        name: "Discussioni generali",
        description: "Parla di Minecraft, del server e di qualunque altra cosa.",
        icon: "chat",
        order: 0,
      },
      {
        slug: "guide",
        name: "Guide e tutorial",
        description: "Trucchi, farm e spiegazioni scritte dalla community.",
        icon: "book",
        order: 1,
      },
      {
        slug: "screenshot",
        name: "Build e screenshot",
        description: "Mostra le tue costruzioni e i momenti migliori in gioco.",
        icon: "grid",
        order: 2,
      },
    ],
  },
  {
    slug: "supporto",
    name: "Supporto",
    description: "Serve una mano?",
    order: 2,
    boards: [
      {
        slug: "aiuto",
        name: "Richieste di aiuto",
        description: "Problemi di connessione, dubbi sui comandi, domande sul server.",
        icon: "search",
        order: 0,
      },
      {
        slug: "bug-report",
        name: "Segnalazione bug",
        description: "Hai trovato qualcosa che non funziona? Raccontacelo qui.",
        icon: "bug",
        order: 1,
      },
      {
        slug: "proposte",
        name: "Proposte e suggerimenti",
        description: "Le idee della community per far crescere VenrixMC.",
        icon: "rocket",
        order: 2,
      },
    ],
  },
  {
    slug: "staff",
    name: "Area staff",
    description: "Visibile solo a chi fa parte del team",
    order: 3,
    boards: [
      {
        slug: "coordinamento-staff",
        name: "Coordinamento",
        description: "Discussioni interne del team, non visibili ai membri.",
        icon: "shield",
        order: 0,
        readRole: "STAFF",
        postRole: "STAFF",
      },
    ],
  },
];
