import type { Metadata } from "next";
import { BansExplorer } from "./BansExplorer";

export const metadata: Metadata = {
  title: "Sanzioni · VenrixMC",
  description: "Lista pubblica di ban, mute, warn e kick di VenrixMC: cerca un giocatore e vedi i dettagli.",
};

export default function BansPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-venrix-radial" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <span className="section-eyebrow">Trasparenza</span>
          <h1 className="section-title">Sanzioni</h1>
          <p className="section-lead">
            Ban, mute, warn e kick inflitti dallo staff. Clicca su una riga per vedere
            motivo, staff, scadenza e testa del giocatore.
          </p>
        </header>

        <div className="mt-10">
          <BansExplorer />
        </div>
      </div>
    </div>
  );
}
