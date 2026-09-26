import type { Metadata } from "next";
import Link from "next/link";
import { AppealForm } from "@/components/forms/AppealForm";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Ban Appeals · VenrixMC" };
export const dynamic = "force-dynamic";

export default async function AppealsPage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-xl text-white sm:text-2xl">Ban Appeals</h1>
      <p className="mt-2 text-slate-400">
        Sei stato bannato e pensi sia stato un errore? Compila il modulo qui sotto: il nostro
        staff esaminerà la tua richiesta. Massimo 3 richieste all'ora per indirizzo IP.
      </p>

      <p className="venrix-card mt-4 border-l-4 border-l-venrix-500/60 p-4 text-sm text-slate-300">
        {session ? (
          <>
            Hai fatto l&apos;accesso: potrai seguire lo stato dell&apos;appeal in{" "}
            <Link href="/dashboard/richieste" className="font-medium text-venrix-300 hover:underline">
              Le mie richieste
            </Link>
            .
          </>
        ) : (
          <>
            <Link
              href="/forum/accedi?next=/appeals"
              className="font-medium text-venrix-300 hover:underline"
            >
              Accedi con Discord
            </Link>{" "}
            prima di inviare l&apos;appeal per seguirne lo stato dalla tua dashboard.
          </>
        )}
      </p>

      <div className="mt-8">
        <AppealForm />
      </div>
    </div>
  );
}
