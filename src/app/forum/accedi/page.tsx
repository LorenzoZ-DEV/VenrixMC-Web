import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isDiscordOAuthConfigured } from "@/lib/discordOAuth";
import { SITE } from "@/lib/constants";
import { IconKey, IconChat, IconUsers } from "@/components/icons";

export const metadata: Metadata = { title: "Accedi al forum · VenrixMC" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  not_configured: "L'accesso con Discord non è ancora configurato sul sito.",
  account_disabled: "Questo account è stato disattivato. Contatta lo staff su Discord.",
  already_linked: "Questo account Discord è già collegato a un altro profilo.",
  exchange_failed: "Discord non ha completato l'accesso. Riprova.",
  invalid_state: "La richiesta è scaduta. Riprova ad accedere.",
  missing_params: "Richiesta incompleta. Riprova ad accedere.",
};

/**
 * Registrazione e accesso del forum: un solo pulsante, niente password.
 * Il primo accesso crea l'account come MEMBER (vedi il callback OAuth), i
 * successivi si limitano ad aggiornare nome e avatar.
 */
export default async function ForumLoginPage({
  searchParams,
}: {
  searchParams: { next?: string; reason?: string };
}) {
  const session = await getSession();
  const next =
    searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//")
      ? searchParams.next
      : "/forum";

  if (session) redirect(next);

  const configured = isDiscordOAuthConfigured();
  const error = searchParams.reason ? (ERRORS[searchParams.reason] ?? "Accesso non riuscito.") : null;

  return (
    <div className="mx-auto max-w-md">
      <div className="venrix-card space-y-5 p-8 text-center">
        <span className="pixel-corners-sm mx-auto flex h-14 w-14 items-center justify-center bg-venrix-600/15 text-venrix-300">
          <IconChat className="h-7 w-7" />
        </span>

        <div>
          <h1 className="font-display text-xl font-bold text-white">Entra nel forum</h1>
          <p className="mt-2 text-sm text-slate-400">
            Il tuo account Discord è tutto quello che serve: niente registrazione, niente password
            da ricordare.
          </p>
        </div>

        {error && (
          <p className="pixel-corners-sm border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </p>
        )}

        {configured ? (
          <a
            href={`/api/auth/discord/start?mode=login&next=${encodeURIComponent(next)}`}
            className="venrix-btn-primary w-full"
          >
            <IconUsers className="h-4 w-4" />
            Accedi con Discord
          </a>
        ) : (
          <p className="pixel-corners-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            L&apos;accesso con Discord non è ancora configurato. Avvisa un amministratore.
          </p>
        )}

        <p className="text-xs text-slate-500">
          Non sei nel nostro server?{" "}
          <a
            href={SITE.discordInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-venrix-300 hover:underline"
          >
            Entra su Discord
          </a>
        </p>

        <p className="border-t border-white/5 pt-4 text-xs text-slate-500">
          Fai parte dello staff?{" "}
          <Link href="/login" className="inline-flex items-center gap-1 font-medium text-venrix-300 hover:underline">
            <IconKey className="h-3 w-3" /> Accedi alla dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
