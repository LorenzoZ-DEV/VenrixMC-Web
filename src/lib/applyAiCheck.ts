import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { AiDetectorError, detectAiText, isAiDetectorConfigured } from "./aiDetector";

/*
 * Rilevamento AI delle candidature staff. Gira da solo subito dopo l'invio
 * e lo staff puo rilanciarlo dalla dashboard. Salva solo il risultato: non
 * cambia lo stato della candidatura, perche' i rilevatori sbagliano e la
 * decisione deve restare a una persona (vedi anche la Privacy Policy).
 */

// Sotto questa soglia (circa 300 caratteri, il minimo consigliato da Sapling)
// il rilevatore tira a indovinare: meglio nessun numero che uno inventato.
const MIN_WORDS = 50;
// Le risposte brevi (nick, eta, scelte da menu) non dicono niente sullo
// stile di scrittura e sporcano la stima.
const MIN_ANSWER_WORDS = 8;

type Answer = { question: string; answer: string };

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Solo il testo libero scritto dal candidato, una risposta per paragrafo. */
export function applicationText(app: {
  experience: string;
  message: string;
  answers: Prisma.JsonValue;
}) {
  const answers = Array.isArray(app.answers) ? (app.answers as unknown as Answer[]) : [];
  const parts = answers.length
    ? answers.map((a) => a.answer)
    : [app.experience, app.message];
  return parts
    .filter((p) => typeof p === "string" && wordCount(p) >= MIN_ANSWER_WORDS)
    .join("\n\n");
}

export async function runApplyAiCheck(applicationId: string) {
  if (!isAiDetectorConfigured()) return null;

  const app = await prisma.staffApply.findUnique({
    where: { id: applicationId },
    select: { experience: true, message: true, answers: true },
  });
  if (!app) return null;

  const text = applicationText(app);
  const now = new Date();

  if (wordCount(text) < MIN_WORDS) {
    return prisma.staffApply.update({
      where: { id: applicationId },
      data: {
        aiPercentage: null,
        aiSentences: [],
        aiCheckedAt: now,
        aiError: "Testo troppo breve per una stima affidabile",
      },
    });
  }

  try {
    const result = await detectAiText(text);
    return prisma.staffApply.update({
      where: { id: applicationId },
      data: {
        aiPercentage: result.percentage,
        aiSentences: result.sentences,
        aiCheckedAt: now,
        aiError: null,
      },
    });
  } catch (err) {
    const message = err instanceof AiDetectorError ? err.message : "Errore imprevisto";
    if (!(err instanceof AiDetectorError)) console.error("[ai-check]", err);
    return prisma.staffApply.update({
      where: { id: applicationId },
      data: { aiCheckedAt: now, aiError: message.slice(0, 300) },
    });
  }
}
