import { PlayerSkinViewer } from "@/components/PlayerSkinViewer";
import { CopyIp } from "@/components/CopyIp";
import { SITE } from "@/lib/constants";

/**
 * La scheda del server nell'hero: nome, versione, indirizzo.
 *
 * La procedura per entrare vive nella sezione `HowToPlay`, che ha lo
 * spazio per spiegarla; qui resta l'indirizzo, che e' la cosa che si va a
 * cercare sopra la piega.
 *
 * Il bottone per copiare vive in `CopyIp`, lo stesso componente usato nei
 * passi: l'indirizzo compare in due punti della pagina, ma il codice che lo
 * copia e' uno solo.
 */
export function JoinServerPanel() {
  return (
    /*
     * Niente overflow-hidden: la skin deve poter debordare oltre il bordo
     * in basso a destra del pannello.
     */
    <div className="surface-raised relative w-full shrink-0 bg-ink-700 sm:w-[420px]">
      <div
        className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5"
      >
        <h2 className="font-display text-base font-bold text-white">{SITE.name}</h2>
        <span className="mono-label rounded-full bg-venrix-600/15 px-2.5 py-1 text-venrix-200">
          Java {SITE.minecraftVersion}+
        </span>
      </div>

      <div className="flex gap-6 p-6 pb-10">
        <div className="min-w-0 flex-1">
          <p className="mono-label text-venrix-200">Indirizzo</p>
          <div className="mt-2">
            <CopyIp />
          </div>
        </div>

        {/* Spazio riservato alla skin, che e' posizionata in assoluto
            rispetto al pannello (non a questo div). */}
        <div className="hidden w-28 shrink-0 sm:block" />
      </div>

      <div className="pointer-events-none absolute bottom-0 right-2 hidden sm:block">
        <PlayerSkinViewer username="Lorenzzzzzz" width={150} height={190} />
      </div>
    </div>
  );
}
