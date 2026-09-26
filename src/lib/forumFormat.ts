/**
 * Testo del forum: i messaggi si scrivono in Markdown e vengono convertiti
 * in HTML qui, sempre passando da DOMPurify. Nessun componente deve mai
 * stampare `content` grezzo: e testo scritto dagli utenti.
 */

import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { randomBytes } from "crypto";

/**
 * Tag ammessi in un messaggio: tutto quello che il Markdown GitHub-flavored
 * sa produrre, meno cio che porta codice o incorpora terzi (script, iframe,
 * form, style). Le tabelle e le immagini ci sono: sono Markdown a tutti gli
 * effetti e senza di loro una guida o una segnalazione con screenshot si
 * riduce a testo sfilacciato.
 *
 * `h1` resta fuori di proposito: il titolo della discussione e gia l'h1 della
 * pagina, e lasciarne un altro dentro al messaggio rompe la gerarchia per
 * chi naviga con uno screen reader.
 */
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "del",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "span",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

/** Solo schemi innocui: niente `javascript:`, `data:` o `vbscript:`. */
const ALLOWED_URI_REGEXP = /^(?:https?:|mailto:|#|\/(?!\/))/i;

/**
 * Irrobustisce quello che DOMPurify da solo non tocca: i link esterni non
 * devono poter pilotare la finestra che li ha aperti, e le immagini devono
 * restare su http(s) — un `src` con uno schema esotico e sopravvissuto al
 * filtro degli URI non deve comunque finire nel documento.
 */
function hardenLinksAndImages(node: Element) {
  if (node.tagName === "A" && node.getAttribute("href")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer nofollow ugc");
  }

  if (node.tagName === "IMG") {
    const src = node.getAttribute("src") ?? "";
    if (!/^https?:\/\//i.test(src)) {
      node.remove();
      return;
    }
    node.setAttribute("loading", "lazy");
    node.setAttribute("decoding", "async");
  }
}

export async function renderForumContent(markdown: string): Promise<string> {
  const html = String(await marked.parse(markdown, { breaks: true, gfm: true }));

  /*
   * L'hook si aggiunge e si toglie attorno alla singola chiamata: DOMPurify
   * e un singleton condiviso con le news e il regolamento, e un hook lasciato
   * attaccato si metterebbe a riscrivere anche quelli. Fra addHook e sanitize
   * non c'e nessun await, quindi la finestra non si puo interlacciare.
   */
  DOMPurify.addHook("afterSanitizeAttributes", hardenLinksAndImages);
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR: ["href", "title", "class", "src", "alt", "align"],
      ADD_ATTR: ["target", "rel", "loading", "decoding"],
      ALLOWED_URI_REGEXP,
    });
  } finally {
    DOMPurify.removeHook("afterSanitizeAttributes");
  }
}

/** Anteprima in chiaro per liste e risultati di ricerca. */
export function contentPreview(markdown: string, length = 160): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_`>#~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return plain.length > length ? `${plain.slice(0, length).trimEnd()}…` : plain;
}

/**
 * Slug di una discussione. Il titolo e libero (accenti, emoji, punteggiatura),
 * quindi al testo ripulito si aggiunge sempre un suffisso casuale: due
 * discussioni con lo stesso titolo restano due URL diversi senza dover
 * ritentare l'inserimento finche l'unique non passa.
 */
export function topicSlug(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");

  const suffix = randomBytes(3).toString("hex");
  return base ? `${base}-${suffix}` : `discussione-${suffix}`;
}

/** Slug stabile per categorie, forum ed etichette (niente suffisso). */
export function nameSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * Slug libero a partire da un nome: se "regolamento" e gia preso diventa
 * "regolamento-2". `exists` decide su quale tabella cercare, cosi categorie,
 * forum ed etichette condividono la stessa logica senza condividere query.
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  fallback = "voce"
): Promise<string> {
  const root = base || fallback;

  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    if (!(await exists(candidate))) return candidate;
  }

  return `${root}-${Date.now().toString(36)}`;
}

const RELATIVE = new Intl.RelativeTimeFormat("it", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 giorni fa", "poco fa" — come le date sul forum di Ninfea. */
export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "poco fa";

  for (const [unit, size] of UNITS) {
    if (seconds >= size) return RELATIVE.format(-Math.floor(seconds / size), unit);
  }
  return "poco fa";
}

export function fullDate(date: Date | string): string {
  return new Date(date).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
