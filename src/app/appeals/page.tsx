import type { Metadata } from "next";
import { AppealForm } from "@/components/forms/AppealForm";

export const metadata: Metadata = { title: "Ban Appeals — VenrixMC" };

export default function AppealsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-xl text-white sm:text-2xl">Ban Appeals</h1>
      <p className="mt-2 text-slate-400">
        Sei stato bannato e pensi sia stato un errore? Compila il modulo qui sotto: il nostro
        staff esaminerà la tua richiesta. Massimo 3 richieste all'ora per indirizzo IP.
      </p>

      <div className="mt-8">
        <AppealForm />
      </div>
    </div>
  );
}
