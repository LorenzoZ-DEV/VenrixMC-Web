import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { APPLY_COOLDOWN_DAYS } from "@/lib/applyCooldown";

export const metadata: Metadata = { title: "Privacy Policy · VenrixMC" };

// Da aggiornare a mano quando cambia il testo o cambiano i dati raccolti
// (validators.ts, schema.prisma): la pagina deve descrivere cosa fa davvero
// il codice, non cosa vorremmo che facesse.
const LAST_UPDATED = "14 ottobre 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-xl text-white sm:text-2xl">Privacy Policy</h1>
      <p className="mt-2 text-slate-400">
        Come raccogliamo e usiamo i tuoi dati quando ti candidi per lo staff di {SITE.name}.
      </p>
      <p className="mono-label mt-3 text-slate-500">Ultimo aggiornamento: {LAST_UPDATED}</p>

      <div className="prose mt-8 max-w-none prose-headings:font-display prose-a:text-venrix-300">
        <h2>1. Chi tratta i dati</h2>
        <p>
          Titolare del trattamento è <strong>{SITE.name}</strong> (di seguito &quot;noi&quot;),
          contattabile all&apos;indirizzo{" "}
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>. Per qualsiasi richiesta
          sui tuoi dati puoi scriverci a questo indirizzo o aprire un ticket sul nostro{" "}
          <a href={SITE.discordInvite} target="_blank" rel="noopener noreferrer">
            server Discord
          </a>
          .
        </p>
        <p>
          Questa informativa riguarda le <strong>candidature staff</strong> inviate dalla pagina{" "}
          <Link href="/staff-apply">Staff Apply</Link> e l&apos;account Discord necessario per
          inviarle.
        </p>

        <h2>2. Quali dati raccogliamo</h2>
        <h3>Dall&apos;accesso con Discord</h3>
        <p>
          Per candidarti devi accedere con Discord. Chiediamo a Discord solo il permesso{" "}
          <code>identify</code>, che ci fornisce:
        </p>
        <ul>
          <li>ID utente Discord (identificativo numerico);</li>
          <li>nome utente e avatar Discord.</li>
        </ul>
        <p>Non riceviamo la tua email, la tua password Discord né l&apos;elenco dei tuoi server.</p>

        <h3>Dal modulo di candidatura</h3>
        <ul>
          <li>nickname Minecraft;</li>
          <li>nome utente Discord indicato nel modulo;</li>
          <li>età;</li>
          <li>posizione per cui ti candidi;</li>
          <li>
            le risposte alle domande del modulo (esperienze, motivazioni, disponibilità e qualsiasi
            altra informazione che scegli di scrivere).
          </li>
        </ul>
        <p>
          Ti chiediamo di <strong>non inserire dati non richiesti</strong>, in particolare dati
          sensibili (salute, opinioni politiche o religiose, ecc.) o dati di altre persone.
        </p>

        <h3>Raccolti automaticamente</h3>
        <ul>
          <li>
            <strong>indirizzo IP</strong> da cui invii la candidatura, salvato insieme alla
            candidatura e usato per limitare gli invii ripetuti;
          </li>
          <li>data e ora di invio e di ogni cambio di stato;</li>
          <li>
            <strong>UUID Minecraft</strong>, ricavato dal nickname tramite il servizio pubblico di
            Mojang;
          </li>
          <li>
            un cookie tecnico di sessione che ti tiene connesso (vedi{" "}
            <a href="#cookie">sezione 7</a>).
          </li>
        </ul>

        <h3>Dati che consultiamo</h3>
        <p>
          Durante la valutazione lo staff consulta lo <strong>storico delle sanzioni</strong> (ban,
          mute, kick e warn) legato al tuo account Minecraft sul server, e verifica che il tuo
          nickname, UUID o ID Discord non siano presenti nella blacklist staff.
        </p>

        <h3>Rilevamento di testo generato con l&apos;AI</h3>
        <p>
          Dopo l&apos;invio, le risposte scritte della candidatura vengono analizzate
          automaticamente con il rilevatore AI di <strong>Sapling</strong>, che stima quale percentuale del testo
          sembra generata con strumenti di intelligenza artificiale e quali frasi lo sembrano di
          più. Salviamo la percentuale e le frasi segnalate insieme alla candidatura.
        </p>

        <h2>3. Perché li usiamo</h2>
        <ul>
          <li>valutare la tua candidatura e organizzare l&apos;eventuale colloquio orale su Discord;</li>
          <li>comunicarti l&apos;esito;</li>
          <li>
            applicare il limite di una candidatura ogni {APPLY_COOLDOWN_DAYS} giorni e il limite di
            invii orari, per prevenire spam e abusi;
          </li>
          <li>far rispettare la blacklist staff;</li>
          <li>
            verificare che le risposte siano scritte da te, come richiesto dai{" "}
            <Link href="/terms">Termini di Servizio</Link>;
          </li>
          <li>tenere un registro interno delle azioni dello staff sulle candidature.</li>
        </ul>
        <p>
          La base giuridica è la tua richiesta di candidarti (art. 6.1.b GDPR) e il nostro legittimo
          interesse a selezionare uno staff affidabile e a proteggere il servizio dagli abusi (art.
          6.1.f GDPR). Non usiamo i tuoi dati per pubblicità, profilazione commerciale o decisioni
          completamente automatizzate: ogni candidatura viene letta e giudicata da una persona. In
          particolare, la stima di Sapling è solo un indizio per lo staff: non respinge da sola
          nessuna candidatura, perché questi strumenti possono sbagliare. Se pensi che sia stata
          valutata in modo errato, puoi chiedere che venga riesaminata.
        </p>

        <h2>4. Chi può vederli</h2>
        <ul>
          <li>
            <strong>Lo staff autorizzato</strong> (Head Staff e superiori; per le candidature
            Builder anche il Capo Builder) dalla dashboard del sito.
          </li>
          <li>
            <strong>Discord</strong>: quando la candidatura viene valutata, il nostro bot può
            inviarti un messaggio privato con l&apos;esito e pubblicare in un canale del nostro
            server Discord un riepilogo con nickname Minecraft, posizione, esito, la tua menzione
            Discord e il membro dello staff che l&apos;ha valutata. Le risposte del modulo, l&apos;età
            e l&apos;IP <strong>non</strong> vengono pubblicati.
          </li>
          <li>
            <strong>Sapling</strong>: riceve solo il testo delle risposte scritte, senza nickname,
            account Discord, età o IP, per restituirci la stima di testo generato con l&apos;AI.
          </li>
          <li>
            <strong>Mojang/Microsoft</strong>: riceve solo il nickname, per restituirci l&apos;UUID
            corrispondente.
          </li>
        </ul>
        <p>
          Discord, Sapling e Mojang/Microsoft trattano i dati secondo le proprie informative e possono
          trovarsi fuori dall&apos;Unione Europea. Non vendiamo né cediamo i tuoi dati a nessun
          altro.
        </p>

        <h2>5. Per quanto tempo li conserviamo</h2>
        <p>
          Le candidature restano archiviate finché servono a gestire la selezione dello staff e a
          far rispettare i limiti di invio, e vengono cancellate dallo staff quando non sono più
          necessarie o su tua richiesta. Le voci della blacklist restano finché lo staff non le
          rimuove. I dati della sessione vengono eliminati quando ti disconnetti o dopo 24 ore di inattività.
        </p>

        <h2>6. Minori</h2>
        <p>
          Puoi candidarti solo se hai l&apos;età minima richiesta dalla posizione. Se hai meno di 14
          anni, puoi inviare la candidatura solo con il consenso di un genitore o di chi ne fa le
          veci. Se veniamo a sapere che una candidatura è stata inviata senza questo consenso, la
          cancelliamo.
        </p>

        <h2 id="cookie">7. Cookie</h2>
        <p>
          Usiamo un solo cookie <strong>tecnico</strong> di sessione, necessario per farti
          accedere e inviare la candidatura. Non contiene dati personali leggibili (solo un
          identificativo cifrato) e non usiamo cookie di profilazione o di tracciamento di terze
          parti.
        </p>

        <h2>8. I tuoi diritti</h2>
        <p>In base al GDPR puoi chiederci in qualsiasi momento di:</p>
        <ul>
          <li>accedere ai dati che abbiamo su di te e riceverne una copia;</li>
          <li>correggerli se sono sbagliati;</li>
          <li>cancellarli, ritirando così anche la candidatura;</li>
          <li>limitarne il trattamento o opporti a esso.</li>
        </ul>
        <p>
          Per esercitare questi diritti scrivi a{" "}
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> o apri un ticket sul
          nostro{" "}
          <a href={SITE.discordInvite} target="_blank" rel="noopener noreferrer">
            Discord
          </a>
          . Hai anche il diritto di presentare reclamo al Garante per la protezione dei dati
          personali (
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
            garanteprivacy.it
          </a>
          ).
        </p>

        <h2>9. Modifiche</h2>
        <p>
          Possiamo aggiornare questa informativa se cambia il modo in cui gestiamo le candidature.
          La data in cima alla pagina indica l&apos;ultima modifica. Consulta anche i{" "}
          <Link href="/terms">Termini di Servizio</Link>.
        </p>
      </div>
    </div>
  );
}
