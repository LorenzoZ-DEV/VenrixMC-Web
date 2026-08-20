import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";
import { getRulesContent } from "@/lib/settings";

export const metadata: Metadata = { title: "Regolamento — VenrixMC" };
export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const content = await getRulesContent();
  const clean = DOMPurify.sanitize(content);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-xl text-white sm:text-2xl">Regolamento</h1>
      <p className="mt-2 text-slate-400">
        Il rispetto delle regole garantisce un'esperienza divertente per tutti.
      </p>

      <div
        className="prose prose-invert prose-purple mt-8 max-w-none prose-headings:font-display prose-a:text-venrix-300"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </div>
  );
}
