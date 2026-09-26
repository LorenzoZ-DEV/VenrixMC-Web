import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { renderForumContent } from "@/lib/forumFormat";

const schema = z.object({ content: z.string().max(20_000) });

/**
 * POST — anteprima di un messaggio.
 *
 * Passa dal server invece che rendere il Markdown nel browser perche cosi
 * l'anteprima usa esattamente lo stesso renderer e la stessa sanitizzazione
 * del messaggio pubblicato: quello che si vede qui e quello che uscira.
 * Riservata a chi e loggato, dato che scrivere lo e gia.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

  return NextResponse.json({ html: await renderForumContent(parsed.data.content) });
}
