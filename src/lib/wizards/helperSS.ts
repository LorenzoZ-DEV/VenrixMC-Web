import { IconSearch, IconUsers, IconCode, IconFileText, IconRocket } from "@/components/icons";
import type { WizardConfig } from "./types";

export const HELPER_SS_WIZARD: WizardConfig = {
  id: "helper-ss",
  roleTitle: "Helper SS",
  intro: {
    icon: IconSearch,
    title: "Candidatura Helper SS",
    body: "L'Helper SS si occupa dei controlli Screen Share (verifica anti-cheat via AnyDesk/Echo). Serve precisione tecnica: rispondi con calma e nel dettaglio a tutte le sezioni.",
  },
  mapping: {
    minecraftName: "nickname",
    discord: "discordId",
    age: "age",
    experience: "toolsUsed",
    message: "whyChooseYou",
  },
  sections: [
    {
      icon: IconUsers,
      title: "Informazioni Personali",
      fields: [
        { id: "nickname", label: "Nickname in gioco:", type: "text", required: true },
        {
          id: "age",
          label: "Età (minimo 15/16 anni consigliati):",
          type: "number",
          required: true,
        },
        { id: "discordId", label: "ID Discord:", type: "text", required: true },
        {
          id: "hasMicAnydesk",
          label: "Hai un microfono funzionante e puoi usare AnyDesk/Echo?",
          type: "select",
          options: ["Sì", "No"],
          required: true,
        },
      ],
    },
    {
      icon: IconSearch,
      title: "Esperienza su VenrixMC",
      fields: [
        {
          id: "memberSince",
          label: "Da quanto tempo giochi su VenrixMC?",
          type: "text",
          required: true,
        },
        {
          id: "pastSanctions",
          label: "Hai mai ricevuto sanzioni (Ban/Mute) sul nostro server? Se sì, perché?",
          type: "textarea",
          required: true,
        },
        {
          id: "dailyHoursAvailable",
          label: "Quante ore al giorno puoi garantire per effettuare controlli SS?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      icon: IconCode,
      title: "Competenze Tecniche (Il cuore del ruolo)",
      fields: [
        {
          id: "toolsUsed",
          label:
            'Quali strumenti (tools) utilizzi solitamente per un controllo SS? (Es: Echo, BLS, Process Hacker, JournalScanner, ecc.)',
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "ghostClientSearch",
          label: 'Spiega brevemente come cercheresti un client "ghost" (nascosto) in un computer.',
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "cheaterConfession",
          label:
            "Come ti comporteresti se un utente ammettesse di aver cheattato appena iniziata la procedura di SS?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "refusesId",
          label: "Cosa fai se un utente rifiuta di fornire il proprio ID AnyDesk o Discord?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "reachVelocityAutoclicker",
          label:
            'Conosci la differenza tra "Reach", "Velocity" e "Autoclicker"? Come li identifichi tramite i log o i processi?',
          type: "textarea",
          required: true,
          minLength: 10,
        },
      ],
    },
    {
      icon: IconFileText,
      title: "Situazioni Ipotetiche",
      fields: [
        {
          id: "insultDuringCheck",
          label:
            "Un utente durante il controllo inizia a insultarti pesantemente per perdere tempo. Come reagisci?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "suspiciousFileNotSure",
          label:
            "Trovi un file sospetto ma non sei sicuro al 100% che sia un cheat. Qual è la tua mossa successiva?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
      ],
    },
    {
      icon: IconRocket,
      title: "Motivazione",
      fields: [
        {
          id: "whyChooseYou",
          label: "Perché dovremmo scegliere te invece di un altro candidato?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "improvementSuggestion",
          label: "Cosa pensi di poter migliorare nel sistema di controllo attuale di VenrixMC?",
          type: "textarea",
          required: false,
        },
      ],
    },
  ],
};
