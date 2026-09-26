import { IconHammer, IconUsers, IconGrid, IconCode, IconRocket } from "@/components/icons";
import type { WizardConfig } from "./types";

export const BUILDER_WIZARD: WizardConfig = {
  id: "builder",
  roleTitle: "Builder",
  intro: {
    icon: IconHammer,
    title: "Candidatura Builder",
    body: "Il Builder progetta e realizza le strutture del server: spawn, eventi e mappe a tema. Oltre al gusto estetico serve una buona padronanza di WorldEdit: rispondi alle domande tecniche con i comandi che useresti davvero.",
  },
  mapping: {
    minecraftName: "nickname",
    discord: "discordId",
    age: "age",
    experience: "pastBuilderExperience",
    message: "whyVenrix",
  },
  sections: [
    {
      icon: IconUsers,
      title: "Informazioni Personali",
      fields: [
        { id: "nickname", label: "Nickname in gioco:", type: "text", required: true },
        { id: "age", label: "Età:", type: "number", required: true },
        { id: "discordId", label: "ID Discord:", type: "text", required: true },
        {
          id: "availability",
          label: "Quante ore a settimana puoi dedicare alle build? In quali fasce orarie?",
          type: "textarea",
          required: true,
        },
      ],
    },
    {
      icon: IconGrid,
      title: "Esperienza da Builder",
      fields: [
        {
          id: "buildingYears",
          label: "Da quanti anni costruisci su Minecraft?",
          type: "text",
          required: true,
        },
        {
          id: "memberSince",
          label: "Da quanto tempo fai parte della community di VenrixMC?",
          type: "text",
          required: true,
        },
        {
          id: "pastBuilderExperience",
          label:
            "Hai già fatto il Builder in altri server o team? Se sì, quali progetti hai realizzato?",
          type: "textarea",
          required: true,
        },
        {
          id: "buildStyles",
          label: "In quali stili ti trovi meglio? (medievale, moderno, fantasy, organico, terraforming...)",
          type: "text",
          required: true,
        },
        {
          id: "portfolio",
          label: "Link al tuo portfolio (screenshot, Imgur, video o server dove vedere le tue build):",
          type: "textarea",
          required: true,
        },
      ],
    },
    {
      icon: IconCode,
      title: "WorldEdit — Le basi",
      fields: [
        {
          id: "weExperience",
          label: "Hai esperienza con WorldEdit?",
          type: "select",
          options: ["Sì, lo uso spesso", "Sì, conosco le basi", "No"],
          required: true,
        },
        {
          id: "weWandSelect",
          label: "Come selezioni un'area con l'ascia di WorldEdit?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "weCopyPaste",
          label: "Come fai a copiare e incollare una costruzione?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "weUndo",
          label: "A cosa serve il comando //undo?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "weCylinder",
          label: "Come fai un cilindro alto 20 blocchi?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
      ],
    },
    {
      icon: IconHammer,
      title: "WorldEdit — Avanzato",
      fields: [
        {
          id: "weRemoveWool",
          label: "Come elimini solo la lana da una selezione?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "weBrushes",
          label: "Quali pennelli (brush) di WorldEdit conosci?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "weSetMistake",
          label: "Se fai un errore enorme con //set, cosa fai per rimediare?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "weSphere",
          label: "Come crei una sfera piena?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "wePyramid",
          label: "Come crei una piramide con i comandi di WorldEdit?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
      ],
    },
    {
      icon: IconRocket,
      title: "Motivazione Finale",
      fields: [
        {
          id: "whyVenrix",
          label: "Perché vuoi costruire proprio per VenrixMC?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "buildIdea",
          label: "Quale build o progetto vorresti realizzare per il server?",
          type: "textarea",
          required: true,
          minLength: 10,
        },
        {
          id: "teamwork",
          label: "Sei disposto a lavorare in team seguendo le indicazioni del Manager/Head Builder?",
          type: "select",
          options: ["Sì", "No", "Dipende dal progetto"],
          required: true,
        },
      ],
    },
  ],
};
