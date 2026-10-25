import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { APPLY_COOLDOWN_DAYS } from "@/lib/applyCooldown";

export const metadata: Metadata = { title: "Termini di Servizio · VenrixMC" };

const LAST_UPDATED = "14 ottobre 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-xl text-white sm:text-2xl">Termini di Servizio</h1>
      <p className="mt-2 text-slate-400">
        Le regole che accetti quando invii una candidatura staff a {SITE.name}.
      </p>
      <p className="mono-label mt-3 text-slate-500">Ultimo aggiornamento: {LAST_UPDATED}</p>

      <div className="prose mt-8 max-w-none prose-headings:font-display prose-a:text-venrix-300">
        <h2>1. Ambito</h2>
        <p>
          Questi termini valgono per le candidature staff inviate dalla pagina{" "}
          <Link href="/staff-apply">Staff Apply</Link>. Inviando una candidatura dichiari di averli
          letti e accettati, insieme alla <Link href="/privacy">Privacy Policy</Link> e al{" "}
          <Link href="/rules">Regolamento</Link> del server.
        </p>
        <p>
          {SITE.name} è un server Minecraft indipendente e non è affiliato con Mojang AB o
          Microsoft.
        </p>

        <h2>2. Requisiti</h2>
        <ul>
          <li>devi accedere con il tuo account Discord personale;</li>
          <li>devi avere l&apos;età minima richiesta dalla posizione per cui ti candidi;</li>
          <li>
            se hai meno di 14 anni ti serve il consenso di un genitore o di chi ne fa le veci;
          </li>
          <li>non devi essere nella blacklist staff.</li>
        </ul>

        <h2>3. Cosa ti impegni a fare</h2>
        <ul>
          <li>
            fornire informazioni <strong>vere</strong>: nickname Minecraft, account Discord ed età
            devono essere i tuoi;
          </li>
          <li>
            scrivere risposte tue, senza copiarle da altri candidati né farle generare da strumenti
            di intelligenza artificiale (ChatGPT e simili). Le risposte vengono analizzate
            automaticamente per stimare quanto testo è generato con l&apos;AI: lo staff usa questa
            stima come indizio, insieme al colloquio, e non come unico motivo di rifiuto;
          </li>
          <li>non candidarti a nome di un&apos;altra persona o usando il suo nickname;</li>
          <li>non inserire contenuti offensivi, illegali o dati personali di terzi;</li>
          <li>non aggirare i limiti di invio (ad esempio con più account).</li>
        </ul>
        <p>
          Una candidatura che viola questi punti può essere respinta o cancellata in qualsiasi
          momento, anche dopo un esito positivo, e può comportare l&apos;inserimento nella
          blacklist staff.
        </p>

        <h2>4. Come funziona la selezione</h2>
        <ul>
          <li>
            puoi inviare <strong>una candidatura ogni {APPLY_COOLDOWN_DAYS} giorni</strong>, per
            qualsiasi posizione; lo staff può concedere eccezioni a sua discrezione;
          </li>
          <li>
            la candidatura si divide in una parte scritta e, se questa viene accettata, un
            colloquio orale su Discord;
          </li>
          <li>
            nella valutazione conta anche lo <strong>storico delle sanzioni</strong> (ban, mute,
            kick e warn) sul server;
          </li>
          <li>
            l&apos;esito ti viene comunicato tramite messaggio privato Discord, se li hai abilitati,
            e può essere annunciato in un canale del nostro server Discord;
          </li>
          <li>puoi ritirare la tua candidatura in qualsiasi momento chiedendolo allo staff.</li>
        </ul>
        <p>
          Lo staff decide liberamente se accettare o respingere una candidatura e non è tenuto a
          motivare la decisione. Inviare una candidatura non dà diritto a un ruolo, a un
          compenso o a un tempo di risposta garantito. I ruoli staff sono volontari e possono
          essere revocati.
        </p>

        <h2>5. Contenuti che invii</h2>
        <p>
          Le risposte restano tue. Ci autorizzi a conservarle e a farle leggere allo staff
          autorizzato per tutto il tempo necessario alla selezione, come descritto nella{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>6. Responsabilità</h2>
        <p>
          Il sito e il modulo di candidatura sono forniti &quot;così come sono&quot;. Facciamo il
          possibile perché funzionino, ma non garantiamo che siano sempre disponibili o privi di
          errori, e non rispondiamo di candidature perse per problemi tecnici: in quel caso
          contattaci su Discord.
        </p>

        <h2>7. Modifiche e contatti</h2>
        <p>
          Possiamo aggiornare questi termini; la data in cima alla pagina indica l&apos;ultima
          modifica e la versione in vigore è quella pubblicata al momento dell&apos;invio. Per
          domande scrivi a <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> o apri
          un ticket sul nostro{" "}
          <a href={SITE.discordInvite} target="_blank" rel="noopener noreferrer">
            server Discord
          </a>
          .
        </p>
      </div>
    </div>
  );
}
