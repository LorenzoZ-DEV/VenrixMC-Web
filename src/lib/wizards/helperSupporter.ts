import { IconUserPlus, IconUsers, IconBook, IconShield, IconChat, IconRocket } from "@/components/icons";
import type { WizardConfig } from "./types";

export const HELPER_SUPPORTER_WIZARD: WizardConfig = {
  id: "helper-supporter",
  roleTitle: "Helper Supporter",
  intro: {
    icon: IconUserPlus,
    title: "Candidatura Helper Supporter",
    body: "Rispondi con calma a tutte le sezioni: risposte dettagliate e sincere contano più della velocità. Puoi tornare indietro in qualsiasi momento prima dell'invio finale.",
  },
  mapping: {
    minecraftName: "nickname",
    discord: "discordId",
    age: "age",
    experience: "pastStaffExperience",
    message: "whyVenrix",
  },
  sections: [
    {
      icon: IconUsers,
      title: "Profilo Generale",
      fields: [
        { id: "discordId", label: "Discord ID:", type: "text", required: true },
        { id: "nickname", label: "Nickname in gioco:", type: "text", required: true },
        { id: "age", label: "Età:", type: "number", required: true },
        {
          id: "availability",
          label:
            "Orari di disponibilità (Specifica fasce orarie per mattina/pomeriggio/sera):",
          type: "textarea",
          required: true,
        },
      ],
    },
    {
      icon: IconBook,
      title: "Conoscenza del Server",
      fields: [
        {
          id: "memberSince",
          label: "Da quanto tempo fai parte della community di VenrixMC?",
          type: "text",
          required: true,
        },
        {
          id: "gamemodes",
          label: "Quali modalità di gioco frequenti di più?",
          type: "text",
          required: true,
        },
        {
          id: "serverGoal",
          label:
            "Sapresti spiegare a un nuovo utente l'obiettivo principale del server in poche righe?",
          type: "textarea",
          required: true,
        },
        {
          id: "pastStaffExperience",
          label: "Hai mai fatto parte dello staff in altri server? Se sì, quali incarichi ricoprivi?",
          type: "textarea",
          required: true,
        },
      ],
    },
    {
      icon: IconShield,
      title: "Gestione dei Conflitti & Regolamento",
      fields: [
        {
          id: "spamHandling",
          label:
            "Un utente sta spammando pesantemente in chat globale. Descrivi l'iter delle sanzioni che applicheresti.",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "insultHandling",
          label:
            "Due giocatori iniziano a insultarsi pesantemente per un furto o una kill. Come intervieni per calmare le acque?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "friendRuleBreak",
          label: "Se un tuo amico stretto infrange il regolamento mentre sei online, come ti comporti?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "technicalUnknown",
          label: "Cosa faresti se un utente ti ponesse una domanda tecnica a cui non sai rispondere?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
      ],
    },
    {
      icon: IconChat,
      title: "Comunicazione e Supporto",
      fields: [
        {
          id: "welcomeMessage",
          label: "Come accoglieresti un nuovo utente appena entrato nel server? Scrivi un messaggio d'esempio.",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "ticketHandling",
          label: "Sei in grado di gestire i ticket su Discord in modo professionale e ordinato?",
          type: "select",
          options: ["Sì", "No", "Parzialmente"],
          required: true,
        },
        {
          id: "bestQuality",
          label: "Qual è, secondo te, la dote più importante per un buon Helper Supporter?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      icon: IconRocket,
      title: "Motivazione Finale",
      fields: [
        {
          id: "whyVenrix",
          label: "Perché vuoi aiutare proprio VenrixMC e non un altro server?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "chatImprovement",
          label: "Cosa faresti per rendere la chat di gioco un ambiente più piacevole?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
      ],
    },
  ],
};
