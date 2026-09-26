/**
 * Formato del regolamento: lo staff sceglie dalla dashboard come scrivere le
 * regole (testo normale, Markdown o HTML grezzo) e qui il contenuto viene
 * convertito in HTML. La sanitizzazione (DOMPurify) resta a chi chiama.
 */

import { marked } from "marked";

export type RulesFormat = "html" | "markdown" | "text";

export const RULES_FORMAT_KEY = "rules_format";
export const DEFAULT_RULES_FORMAT: RulesFormat = "html";

export function parseRulesFormat(raw: unknown): RulesFormat {
  return raw === "markdown" || raw === "text" || raw === "html" ? raw : "html";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Testo normale -> paragrafi: righe vuote separano, a capo singolo va a capo. */
function textToHtml(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p>${chunk.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/** Converte il corpo nel formato dato in HTML (non sanitizzato). */
export async function renderRulesBody(format: RulesFormat, body: string): Promise<string> {
  if (format === "markdown") {
    return String(await marked.parse(body, { breaks: true }));
  }
  if (format === "text") {
    return textToHtml(escapeHtml(body));
  }
  return body;
}
