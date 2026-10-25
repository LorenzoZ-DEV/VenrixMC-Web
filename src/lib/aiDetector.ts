/*
 * Client minimo del rilevatore AI di Sapling
 * (https://sapling.ai/docs/api/detector/). Solo server: usa la chiave
 * segreta SAPLING_API_KEY, che non deve mai arrivare al browser.
 *
 * Il piano gratuito vale 50.000 caratteri al giorno e 250.000 al mese
 * (https://sapling.ai/docs/rate_limits/): da qui il tetto MAX_CHARS per
 * candidatura, cosi una sola risposta chilometrica non si mangia la giornata.
 *
 * Nessun rilevatore legge watermark: la stima e' statistica e sbaglia,
 * soprattutto su testi brevi e in italiano (Sapling lo dichiara: il modello
 * multilingua non ha ancora dati di addestramento in italiano). E' un indizio
 * per lo staff, non una prova.
 */

const ENDPOINT = "https://api.sapling.ai/api/v1/aidetect";
const MAX_CHARS = 8_000;
// Sapling considera "generata" una frase da 0.5 in su: e' la stessa soglia
// che usa per calcolare ai_fraction.
const SENTENCE_THRESHOLD = 0.5;

export type AiDetection = {
  /** Percentuale di testo stimata come generata dall'AI, 0-100. */
  percentage: number;
  /** Frasi che il rilevatore considera generate. */
  sentences: string[];
};

export class AiDetectorError extends Error {}

export function isAiDetectorConfigured() {
  return Boolean(process.env.SAPLING_API_KEY);
}

export async function detectAiText(text: string): Promise<AiDetection> {
  const apiKey = process.env.SAPLING_API_KEY;
  if (!apiKey) throw new AiDetectorError("SAPLING_API_KEY non configurata");

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: apiKey, text: text.slice(0, MAX_CHARS), sent_scores: true }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new AiDetectorError("Sapling non raggiungibile");
  }

  const body = (await res.json().catch(() => null)) as {
    score?: number;
    ai_fraction?: number | null;
    sentence_scores?: { sentence: string; score: number }[];
    msg?: string;
  } | null;

  // 402 vuol dire due cose diverse: quota del giorno finita (passa a
  // mezzanotte UTC) oppure chiave/abbonamento scaduto (non passa da solo).
  // Il messaggio di Sapling le distingue, quindi lo si mostra cosi com'e.
  if (res.status === 402) {
    throw new AiDetectorError(
      body?.msg ? `Sapling: ${body.msg}` : "Limite gratuito di Sapling esaurito per oggi: riprova domani"
    );
  }
  if (!res.ok || typeof body?.score !== "number") {
    throw new AiDetectorError(body?.msg || `Sapling ha risposto ${res.status}`);
  }

  // ai_fraction e' la quota di testo nelle frasi segnalate: risponde a "quanto
  // della candidatura e' AI", che e' la domanda dello staff. Manca solo se
  // nessuna frase e' stata valutata; allora si ripiega sul punteggio globale.
  const fraction = typeof body.ai_fraction === "number" ? body.ai_fraction : body.score;

  return {
    percentage: Math.max(0, Math.min(100, fraction * 100)),
    sentences: (body.sentence_scores ?? [])
      .filter((s) => typeof s.sentence === "string" && s.score >= SENTENCE_THRESHOLD)
      .map((s) => s.sentence.trim())
      .filter(Boolean),
  };
}
