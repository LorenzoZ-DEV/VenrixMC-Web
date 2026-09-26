import { z } from "zod";
import { StaffRole } from "@prisma/client";

/** A raw Discord snowflake — staff can paste one to force who gets the DM. */
export const discordIdSchema = z
  .string()
  .trim()
  .regex(/^\d{17,20}$/, "Discord ID non valido");

export const appealSchema = z.object({
  minecraftName: z
    .string()
    .trim()
    .min(3, "Nome troppo corto")
    .max(16, "Nome troppo lungo")
    .regex(/^[A-Za-z0-9_]+$/, "Nome Minecraft non valido"),
  uuid: z.string().trim().max(36).optional().or(z.literal("")),
  // Free-form: this server's LiteBans shows players a formatted code (e.g.
  // "F06494"), not a plain number — see lib/litebans.ts parseBanDisplayId.
  banId: z.string().trim().max(20).optional().or(z.literal("")),
  banReason: z.string().trim().min(2, "Indica il motivo del ban").max(500),
  // Optional: lets us DM the player the outcome (see lib/discordNotify.ts).
  discord: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(20, "Spiega la tua situazione (min 20 caratteri)").max(3000),
});
export type AppealInput = z.infer<typeof appealSchema>;

export const appealUpdateSchema = z
  .object({
    status: z.enum(["PENDING", "APPROVED", "DENIED"]).optional(),
    staffNotes: z.string().trim().max(2000).optional(),
    discordId: discordIdSchema.optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // Chi approva un appeal deve scriverne la motivazione nelle note staff.
    if (data.status === "APPROVED" && !data.staffNotes?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Scrivi la motivazione dell'accettazione nelle note staff",
        path: ["staffNotes"],
      });
    }
  });

export const staffApplyAnswerSchema = z.object({
  section: z.string().trim().min(1).max(100),
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(3000),
});

export const staffApplySchema = z
  .object({
    minecraftName: z
      .string()
      .trim()
      .min(3)
      .max(16)
      .regex(/^[A-Za-z0-9_]+$/, "Nome Minecraft non valido"),
    discord: z.string().trim().min(2).max(40),
    age: z.coerce.number().int().min(10).max(99),
    // Free-form form: experience/message must meet the length bar directly.
    // Structured wizard (e.g. Helper Supporter): experience/message are
    // derived from `answers` and only need to be non-empty — the real
    // per-question quality bar is enforced client-side in the wizard.
    experience: z.string().trim().min(1).max(3000),
    roles: z.string().trim().min(1).max(100),
    message: z.string().trim().min(1).max(3000),
    answers: z.array(staffApplyAnswerSchema).max(50).optional(),
  })
  .refine(
    (data) => data.answers?.length || (data.experience.length >= 20 && data.message.length >= 20),
    {
      message: "Racconta la tua esperienza e la tua motivazione (min 20 caratteri ciascuna)",
      path: ["experience"],
    }
  );
export type StaffApplyInput = z.infer<typeof staffApplySchema>;
export type StaffApplyAnswer = z.infer<typeof staffApplyAnswerSchema>;

export const staffApplyUpdateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  discordId: discordIdSchema.optional().or(z.literal("")),
});

export const discordNotifySchema = z.object({
  enabled: z.boolean(),
  guildId: z.string().trim().regex(/^\d{17,20}$/).or(z.literal("")),
  applicationsChannelId: z.string().trim().regex(/^\d{17,20}$/).or(z.literal("")),
  appealsChannelId: z.string().trim().regex(/^\d{17,20}$/).or(z.literal("")),
  dmApplications: z.boolean(),
  dmAppeals: z.boolean(),
  includeStaffNotes: z.boolean(),
});

export const announcementSchema = z.object({
  enabled: z.boolean(),
  kind: z.enum(["maintenance", "incident", "info"]),
  message: z.string().trim().max(500),
});

export const serverModeSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(40),
  host: z.string().trim().min(1).max(100),
  port: z.coerce.number().int().min(1).max(65535),
  statusOverride: z.enum(["auto", "online", "offline", "maintenance"]).optional().default("auto"),
});

export const serverModesSchema = z.array(serverModeSchema).max(30);

export const staffPositionSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug non valido (usa minuscole, numeri e trattini)"),
  title: z.string().trim().min(1).max(60),
  tagline: z.string().trim().min(1).max(500),
  icon: z.string().trim().min(1).max(30),
  slots: z.coerce.number().int().min(0).max(99),
  open: z.boolean(),
  requirements: z.array(z.string().trim().min(1).max(200)).max(20),
  wizardId: z.string().trim().max(50).nullable().optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
});
export const staffPositionUpdateSchema = staffPositionSchema.partial();

// Membro del team mostrato in /staff. `username` e un nick Minecraft: da li
// vengono skin e testa renderizzate, quindi vale il vincolo di Mojang
// (3-16 caratteri fra lettere, cifre e underscore).
export const staffMemberSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(16)
    .regex(/^[A-Za-z0-9_]+$/, "Nickname Minecraft non valido"),
  // Presa dall enum Prisma invece che riscritta: aggiungere un rank allo
  // schema lo rende accettabile qui senza doversi ricordare di questo file.
  role: z.nativeEnum(StaffRole),
  description: z.string().trim().min(10).max(600),
  order: z.coerce.number().int().min(0).max(999).optional(),
  visible: z.boolean().optional(),
});
export const staffMemberUpdateSchema = staffMemberSchema.partial();
export type StaffMemberInput = z.infer<typeof staffMemberSchema>;

export const profileUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Inserisci la password attuale"),
  username: z.string().trim().min(3).max(32).optional(),
  email: z.string().trim().email().optional(),
  newPassword: z.string().min(8).max(200).optional(),
});

export const newsSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(150)
    .regex(/^[a-z0-9-]+$/, "Slug non valido (usa minuscole, numeri e trattini)"),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().trim().min(10),
  // Percorso locale (/imgs/cover.png) oppure URL esterno http(s): il render usa
  // <CoverImage>, che per gli URL remoti bypassa l'ottimizzatore di next/image.
  coverImage: z
    .string()
    .trim()
    .max(300)
    .refine(
      (v) => v === "" || v.startsWith("/") || /^https?:\/\/\S+$/i.test(v),
      "L'immagine deve essere un percorso tipo /imgs/cover.png oppure un URL che inizia con http:// o https://",
    )
    .optional(),
  published: z.boolean().optional(),
});
export type NewsInput = z.infer<typeof newsSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(150),
  password: z.string().min(6).max(200),
});

export const userCreateSchema = z.object({
  username: z.string().trim().min(3).max(32),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["BUILDER", "STAFF", "HEAD", "ADMIN", "DEVELOPER"]),
});

export const userUpdateSchema = z.object({
  username: z.string().trim().min(3).max(32).optional(),
  email: z.string().trim().email().optional(),
  // MEMBER incluso: serve a riportare uno staffer a semplice utente del forum.
  role: z.enum(["MEMBER", "BUILDER", "STAFF", "HEAD", "ADMIN", "DEVELOPER"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});

export const settingsUpdateSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.string().max(50_000),
});

// ---------------------------------------------------------------------------
//  Forum
// ---------------------------------------------------------------------------

const roleEnum = z.enum(["MEMBER", "STAFF", "HEAD", "ADMIN", "DEVELOPER"]);

/** Ruolo minimo di un board: la stringa vuota del <select> significa "tutti". */
const gateRole = roleEnum.nullable().optional().or(z.literal("").transform(() => null));

export const forumCategorySchema = z.object({
  name: z.string().trim().min(2, "Nome troppo corto").max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).max(999).optional(),
  visible: z.boolean().optional(),
});
export const forumCategoryUpdateSchema = forumCategorySchema.partial();

export const forumBoardSchema = z.object({
  categoryId: z.string().trim().min(1, "Scegli una categoria"),
  /** Forum padre: rende questo una sotto-sezione. Vuoto = primo livello. */
  parentId: z
    .string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  name: z.string().trim().min(2, "Nome troppo corto").max(80),
  description: z.string().trim().min(5, "Descrivi di cosa si parla qui").max(500),
  icon: z.string().trim().min(1).max(30),
  order: z.coerce.number().int().min(0).max(999).optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  readRole: gateRole,
  postRole: gateRole,
  /** Etichette abilitate qui; vuoto = quelle globali. */
  tagIds: z.array(z.string().trim().min(1)).max(40).optional(),
});
export const forumBoardUpdateSchema = forumBoardSchema.partial();

export const forumTagSchema = z.object({
  name: z.string().trim().min(2, "Nome troppo corto").max(40),
  color: z.string().trim().min(1).max(20),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).max(999).optional(),
  staffOnly: z.boolean().optional(),
  boardIds: z.array(z.string().trim().min(1)).max(60).optional(),
});
export const forumTagUpdateSchema = forumTagSchema.partial();

export const forumTopicSchema = z.object({
  boardId: z.string().trim().min(1),
  title: z.string().trim().min(5, "Il titolo è troppo corto").max(160),
  content: z.string().trim().min(10, "Scrivi almeno 10 caratteri").max(20_000),
  tagIds: z.array(z.string().trim().min(1)).max(5, "Massimo 5 etichette").optional(),
});
export type ForumTopicInput = z.infer<typeof forumTopicSchema>;

/**
 * Aggiornamento di una discussione. Campi diversi, permessi diversi: il
 * titolo lo tocca anche l'autore, pin/lock/spostamento solo lo staff — la
 * distinzione la fa la rotta, non lo schema.
 */
export const forumTopicUpdateSchema = z.object({
  title: z.string().trim().min(5).max(160).optional(),
  pinned: z.boolean().optional(),
  locked: z.boolean().optional(),
  boardId: z.string().trim().min(1).optional(),
  tagIds: z.array(z.string().trim().min(1)).max(5).optional(),
});

export const forumPostSchema = z.object({
  topicId: z.string().trim().min(1),
  content: z.string().trim().min(2, "Il messaggio è vuoto").max(20_000),
});

export const forumPostUpdateSchema = z.object({
  content: z.string().trim().min(2, "Il messaggio è vuoto").max(20_000),
});

export const forumReactionSchema = z.object({
  type: z.enum(["LIKE", "LOVE", "LAUGH", "AGREE"]),
});

/** Profilo pubblico che il membro modifica da solo. */
export const forumProfileSchema = z.object({
  minecraftName: z
    .string()
    .trim()
    .min(3)
    .max(16)
    .regex(/^[A-Za-z0-9_]+$/, "Nickname Minecraft non valido")
    .optional()
    .or(z.literal("")),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  signature: z.string().trim().max(300).optional().or(z.literal("")),
});

/** Moderazione di un membro dalla dashboard. */
export const forumMemberUpdateSchema = z.object({
  forumMuted: z.boolean().optional(),
  active: z.boolean().optional(),
});

/**
 * Nuova voce in blacklist candidature. I tre identificatori sono tutti
 * opzionali presi singolarmente, ma almeno uno deve esserci: una voce senza
 * nessun dato non potrebbe mai combaciare con nessuno e resterebbe li' a
 * ingombrare la lista.
 */
export const staffBlacklistSchema = z
  .object({
    minecraftUuid: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/, {
        message: "UUID non valido (32 caratteri esadecimali, con o senza trattini).",
      })
      .optional()
      .or(z.literal("")),
    minecraftName: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9_]{3,16}$/, { message: "Nick Minecraft non valido (3-16 caratteri)." })
      .optional()
      .or(z.literal("")),
    discordId: z
      .string()
      .trim()
      .regex(/^\d{17,20}$/, { message: "ID Discord non valido (17-20 cifre)." })
      .optional()
      .or(z.literal("")),
    reason: z
      .string()
      .trim()
      .min(3, "Indica il motivo del blocco.")
      .max(1000, "Il motivo non puo superare i 1000 caratteri."),
  })
  .refine((v) => Boolean(v.minecraftUuid || v.minecraftName || v.discordId), {
    message: "Indica almeno un dato fra UUID, nick e ID Discord.",
    path: ["minecraftName"],
  });
