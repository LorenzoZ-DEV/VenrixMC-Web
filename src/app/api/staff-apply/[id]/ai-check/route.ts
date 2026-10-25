import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApplicationReviewer } from "@/lib/auth";
import { runApplyAiCheck } from "@/lib/applyAiCheck";
import { isAiDetectorConfigured } from "@/lib/aiDetector";
import { rateLimit } from "@/lib/rateLimit";

/**
 * Rilancia il controllo AI (Sapling) su una candidatura: per quelle arrivate
 * prima dell'integrazione o quando il controllo automatico e' fallito.
 * Ogni chiamata consuma la quota giornaliera gratuita di Sapling, da qui il
 * limite per membro staff.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApplicationReviewer();
  if ("response" in auth) return auth.response;

  if (!isAiDetectorConfigured()) {
    return NextResponse.json(
      { error: "Rilevamento AI non configurato: manca SAPLING_API_KEY sul server." },
      { status: 503 }
    );
  }

  const limit = await rateLimit(auth.session.userId, "apply-ai-check", 20, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Troppi controlli AI nell'ultima ora. Riprova più tardi." },
      { status: 429 }
    );
  }

  const existing = await prisma.staffApply.findFirst({
    where: { id: params.id, ...auth.scope },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  const updated = await runApplyAiCheck(existing.id);
  if (!updated) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  return NextResponse.json({
    aiPercentage: updated.aiPercentage,
    aiSentences: updated.aiSentences,
    aiCheckedAt: updated.aiCheckedAt,
    aiError: updated.aiError,
  });
}
