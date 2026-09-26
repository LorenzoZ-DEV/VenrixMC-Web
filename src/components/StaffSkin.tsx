"use client";

import { useState } from "react";

/**
 * Testa 2D per le schede /staff.
 *
 * `helm` e' la testa con sopra il secondo strato della skin (cappello,
 * capelli, maschera): senza, meta' delle skin perde il dettaglio che le
 * rende riconoscibili.
 *
 * Si chiede l'immagine a 160px per uno spazio di 96: le teste sono 8x8
 * pixel di sorgente, e su schermi a densita' doppia una richiesta da 96
 * arriverebbe gia' interpolata dal server. Il resto lo fa
 * `image-rendering: pixelated`, che tiene i bordi netti invece di
 * sfocarli nell'ingrandimento.
 *
 * Niente WebGL: il viewer 3D apre un contesto per scheda e i browser ne
 * concedono una manciata per pagina, quindi con venti staffer le ultime
 * schede restavano vuote.
 */
const HELM = (username: string) => `https://minotar.net/helm/${encodeURIComponent(username)}/160`;

export function StaffSkin({ username }: { username: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="surface-inset flex h-24 w-24 items-center justify-center overflow-hidden">
      {failed ? (
        // Ultima spiaggia: l'iniziale. Un riquadro vuoto sembrerebbe un
        // errore di caricamento ancora in corso.
        <span className="font-display text-3xl font-extrabold text-venrix-500/60">
          {username.slice(0, 1).toUpperCase()}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={HELM(username)}
          alt={`Testa della skin di ${username}`}
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
          className="h-24 w-24"
          style={{ imageRendering: "pixelated" }}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
