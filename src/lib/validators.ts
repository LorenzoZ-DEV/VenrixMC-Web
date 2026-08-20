import { z } from "zod";

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
  banReason: z.string().trim().max(500).optional().or(z.literal("")),
  message: z.string().trim().min(20, "Spiega la tua situazione (min 20 caratteri)").max(3000),
});
export type AppealInput = z.infer<typeof appealSchema>;

export const appealUpdateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "DENIED"]).optional(),
  staffNotes: z.string().trim().max(2000).optional(),
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
});

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
  coverImage: z.string().trim().max(300).optional().or(z.literal("")),
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
  role: z.enum(["STAFF", "HEAD", "ADMIN", "DEVELOPER"]),
});

export const userUpdateSchema = z.object({
  username: z.string().trim().min(3).max(32).optional(),
  email: z.string().trim().email().optional(),
  role: z.enum(["STAFF", "HEAD", "ADMIN", "DEVELOPER"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});

export const settingsUpdateSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.string().max(50_000),
});
