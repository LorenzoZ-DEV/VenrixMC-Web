"use client";

import { useState } from "react";
import clsx from "clsx";
import type { ForumReactionType } from "@prisma/client";
import { FORUM_REACTIONS, FORUM_REACTION_KEYS } from "@/lib/forumMeta";

/**
 * Reazioni a un messaggio. Una sola per persona: ripremere la stessa la
 * toglie, premerne un'altra la sostituisce — la regola vive nel database
 * (unique postId+userId) e qui si limita a rispecchiare la risposta.
 *
 * Senza sessione i bottoni non compaiono proprio: mostrare un tasto che
 * risponde 401 non aiuta nessuno. Restano visibili i conteggi.
 */
export function ReactionBar({
  postId,
  counts,
  mine,
  canReact,
}: {
  postId: string;
  counts: Record<string, number>;
  mine: ForumReactionType | null;
  canReact: boolean;
}) {
  const [state, setState] = useState({ counts, mine });
  const [busy, setBusy] = useState(false);

  async function react(type: ForumReactionType) {
    if (busy || !canReact) return;
    setBusy(true);

    try {
      const res = await fetch(`/api/forum/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        setState({ counts: data.counts, mine: data.mine });
      }
    } catch {
      // Una reazione non andata a buon fine non merita un messaggio d'errore:
      // lo stato resta quello di prima e basta riprovare.
    } finally {
      setBusy(false);
    }
  }

  const total = Object.values(state.counts).reduce((a, b) => a + b, 0);

  if (!canReact && total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FORUM_REACTION_KEYS.map((type) => {
        const count = state.counts[type] ?? 0;
        if (!canReact && count === 0) return null;

        return (
          <button
            key={type}
            type="button"
            title={FORUM_REACTIONS[type].label}
            disabled={!canReact || busy}
            onClick={() => react(type)}
            className={clsx(
              "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs transition",
              state.mine === type
                ? "border-venrix-500/40 bg-venrix-600/15 text-venrix-200"
                : "border-white/10 bg-white/5 text-slate-400",
              canReact && "hover:border-venrix-500/40 hover:text-venrix-200",
              !canReact && "cursor-default"
            )}
          >
            <span aria-hidden>{FORUM_REACTIONS[type].emoji}</span>
            {count > 0 && <span className="font-semibold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
