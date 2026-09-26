import { CopyIp } from "@/components/CopyIp";
import { SITE } from "@/lib/constants";

/**
 * "Come giocare": i tre passi per entrare sul server.
 *
 * Era il pezzo che mancava alla home. Prima l'indirizzo viveva solo dentro
 * il pannello dell'hero, accanto alla skin, senza dire cosa farne: chi non
 * ha mai aggiunto un server a Minecraft restava fermo li'.
 *
 * I tre riquadri NON sono larghi uguali. Il passo centrale, quello con
 * l'indirizzo da copiare, prende piu' spazio degli altri due perche' e'
 * l'unico su cui si agisce: tre colonne identiche avrebbero detto che i tre
 * momenti pesano uguale, e non e' vero.
 */
const STEPS = [
  {
    n: "1",
    title: "Apri Minecraft",
    body: `Java Edition ${SITE.minecraftVersion} o successiva. Dal menu principale scegli Multiplayer, poi Aggiungi server.`,
  },
  {
    n: "3",
    title: "Entra e gioca",
    body: "Seleziona VenrixMC dalla lista e premi Entra. Al primo accesso ti accoglie lo spawn: da li' parti.",
  },
];

export function HowToPlay() {
  const [first, last] = STEPS;

  return (
    <section className="relative border-t border-white/10 bg-ink-900">
      <div aria-hidden className="pointer-events-none absolute inset-0 glow-brand" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <h2 className="section-title ">Come giocare</h2>
        <p className="section-lead">
          Tre passi, meno di un minuto. Serve solo Minecraft Java già installato.
        </p>

        <ol className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.35fr_1fr] lg:items-stretch">
          <Step {...first} />

          {/* Il passo che conta: l'indirizzo e il bottone per copiarlo. */}
          <li className="venrix-card flex flex-col p-7">
            <StepNumber n="2" />
            <h3 className="mt-5 font-display text-xl font-bold text-white">
              Aggiungi il server
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">
              Nel campo Indirizzo server incolla questo. Il nome puoi scriverlo come preferisci.
            </p>
            <div className="mt-auto pt-6">
              <CopyIp size="lg" />
            </div>
          </li>

          <Step {...last} />
        </ol>
      </div>
    </section>
  );
}

/* Il numero sta in uno slot dell'inventario, come un oggetto nella hotbar:
   e' il marcatore d'ordine, non l'etichetta del passo. L'etichetta e' il
   verbo che da' il titolo al riquadro. */
function StepNumber({ n }: { n: string }) {
  return (
    <span className="surface-inset flex h-12 w-12 items-center justify-center font-display text-xl font-bold text-venrix-200">
      {n}
    </span>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="venrix-card flex flex-col p-7">
      <StepNumber n={n} />
      <h3 className="mt-5 font-display text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{body}</p>
    </li>
  );
}
