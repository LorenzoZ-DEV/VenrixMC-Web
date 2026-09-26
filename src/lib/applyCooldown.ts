import type { ApplyStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { findBlacklistMatch } from "./staffBlacklist";

/** Una candidatura ogni 14 giorni, qualunque sia la posizione scelta. */
export const APPLY_COOLDOWN_DAYS = 14;
const COOLDOWN_MS = APPLY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export type LastApplication = {
  id: string;
  roles: string;
  status: ApplyStatus;
  createdAt: Date;
};

export type ApplyEligibility =
  | { allowed: true }
  | { allowed: false; last: LastApplication; nextAt: Date };

/**
 * Stato del limite per un account. Contano solo le candidature degli ultimi
 * 14 giorni *e* successive all'ultimo sblocco dato dallo staff
 * (`applyCooldownResetAt`): cosi un'eccezione vale per una candidatura sola,
 * e quella nuova fa ripartire il conto.
 */
export async function getApplyEligibility(userId: string): Promise<ApplyEligibility> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { applyCooldownResetAt: true },
  });

  const windowStart = new Date(Date.now() - COOLDOWN_MS);
  const resetAt = user?.applyCooldownResetAt;
  const since = resetAt && resetAt > windowStart ? resetAt : windowStart;

  const last = await prisma.staffApply.findFirst({
    where: { userId, createdAt: { gt: since } },
    orderBy: { createdAt: "desc" },
    select: { id: true, roles: true, status: true, createdAt: true },
  });

  if (!last) return { allowed: true };
  return { allowed: false, last, nextAt: new Date(last.createdAt.getTime() + COOLDOWN_MS) };
}

/** Quello che le pagine di candidatura devono sapere prima di mostrare il modulo. */
export type ApplyGate =
  | { state: "guest" }
  | { state: "open" }
  | { state: "blacklisted"; reason: string }
  | { state: "blocked"; roles: string; status: ApplyStatus; createdAt: string; nextAt: string };

export async function getApplyGate(): Promise<ApplyGate> {
  const session = await getSession();
  if (!session) return { state: "guest" };

  const account = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { minecraftName: true, discordId: true },
  });

  /*
   * La blacklist viene prima del limite dei 14 giorni: a chi e' escluso non
   * interessa quando potra' riprovare, e mostrargli una data sarebbe una
   * risposta sbagliata.
   *
   * Qui NON si risolve l'UUID via Mojang: questa funzione gira a ogni
   * apertura della pagina, e una chiamata di rete la rallenterebbe per
   * tutti. Il controllo completo, UUID compreso, e' quello dell'invio
   * (api/staff-apply), che e' il punto in cui il blocco conta davvero.
   */
  const blacklisted = await findBlacklistMatch({
    minecraftName: account?.minecraftName,
    discordId: account?.discordId,
  });
  if (blacklisted) return { state: "blacklisted", reason: blacklisted.reason };

  const eligibility = await getApplyEligibility(session.userId);
  if (eligibility.allowed) return { state: "open" };

  return {
    state: "blocked",
    roles: eligibility.last.roles,
    status: eligibility.last.status,
    createdAt: eligibility.last.createdAt.toISOString(),
    nextAt: eligibility.nextAt.toISOString(),
  };
}

export function formatItDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
