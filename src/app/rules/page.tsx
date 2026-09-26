import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";
import { getRulesContent, getSetting } from "@/lib/settings";
import { parseRulesFormat, renderRulesBody } from "@/lib/rulesFormat";

export const metadata: Metadata = { title: "Regolamento · VenrixMC" };
export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const [content, formatRaw] = await Promise.all([
    getRulesContent(),
    getSetting("rules_format"),
  ]);
  const clean = DOMPurify.sanitize(await renderRulesBody(parseRulesFormat(formatRaw), content));

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-xl text-white sm:text-2xl">Regolamento</h1>
      <p className="mt-2 text-slate-400">
        Il rispetto delle regole garantisce un'esperienza divertente per tutti.
      </p>

      <div
        className="prose mt-8 max-w-none prose-headings:font-display prose-a:text-venrix-300"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </div>
  );
}
