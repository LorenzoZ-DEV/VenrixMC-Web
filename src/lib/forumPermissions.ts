import type { Role } from "@prisma/client";
import { hasRole } from "./auth";
import type { SessionData } from "./session";

/**
 * Chi puo fare cosa sul forum.
 *
 * Due assi indipendenti: il *ruolo* (MEMBER < STAFF < HEAD < ADMIN <
 * DEVELOPER, vedi lib/roles.ts) e le *regole del board* (readRole/postRole
 * nulli = aperto a tutti / a ogni membro loggato). Lo stato di mute non sta
 * nella sessione ma sulla riga `users`, perche silenziare qualcuno deve
 * avere effetto subito e non alla scadenza del cookie: le rotte di scrittura
 * lo rileggono dal database e lo passano qui.
 */

export type BoardGate = {
  visible: boolean;
  locked: boolean;
  readRole: Role | null;
  postRole: Role | null;
  /** Presente solo per le sotto-sezioni: il forum che le contiene. */
  parent?: { visible: boolean; readRole: Role | null } | null;
};

/** Lo staff vede e modera tutto, board nascosti compresi. */
export function canModerate(session: SessionData | null): boolean {
  return hasRole(session, "STAFF");
}

/** Il singolo cancelletto di lettura, senza guardare la gerarchia. */
function passesReadGate(
  session: SessionData | null,
  gate: { visible: boolean; readRole: Role | null }
): boolean {
  if (!gate.visible) return false;
  return gate.readRole === null || hasRole(session, gate.readRole);
}

export function canViewBoard(session: SessionData | null, board: BoardGate): boolean {
  if (canModerate(session)) return true;
  if (!passesReadGate(session, board)) return false;

  // Una sotto-sezione non puo essere piu accessibile del forum che la
  // contiene: nascondere un'area deve nascondere tutto il suo ramo, altrimenti
  // basterebbe conoscere lo slug di una figlia per scavalcare il padre.
  if (board.parent && !passesReadGate(session, board.parent)) return false;

  return true;
}

/** Aprire una discussione nel board. */
export function canCreateTopic(
  session: SessionData | null,
  board: BoardGate,
  muted = false
): boolean {
  if (!session || muted) return false;
  if (canModerate(session)) return true;
  if (board.locked || !board.visible) return false;
  if (!canViewBoard(session, board)) return false;
  return board.postRole === null || hasRole(session, board.postRole);
}

/** Rispondere in una discussione: come sopra, piu il lucchetto del topic. */
export function canReply(
  session: SessionData | null,
  board: BoardGate,
  topic: { locked: boolean },
  muted = false
): boolean {
  if (!session || muted) return false;
  if (canModerate(session)) return true;
  if (topic.locked) return false;
  return canCreateTopic(session, board, muted);
}

/** L'autore puo correggersi finche la discussione e aperta; lo staff sempre. */
export function canEditPost(
  session: SessionData | null,
  post: { authorId: string },
  topic: { locked: boolean },
  muted = false
): boolean {
  if (!session) return false;
  if (canModerate(session)) return true;
  if (muted || topic.locked) return false;
  return post.authorId === session.userId;
}

/** Cancellare un messaggio: l'autore il proprio, lo staff qualunque. */
export function canDeletePost(
  session: SessionData | null,
  post: { authorId: string; opening: boolean },
  topic: { locked: boolean }
): boolean {
  if (!session) return false;
  if (canModerate(session)) return true;
  // Il messaggio di apertura se ne va solo insieme alla discussione.
  if (post.opening || topic.locked) return false;
  return post.authorId === session.userId;
}

/**
 * Filtro Prisma che nasconde ai non-staff i board non accessibili.
 * `readRole` nullo va cercato a parte: in SQL `IN (...)` non intercetta NULL.
 *
 * Il secondo blocco applica la stessa regola al forum padre, cosi una
 * sotto-sezione di un'area riservata non spunta nelle liste (ultimi messaggi,
 * ricerca) di chi non puo vedere quell'area.
 */
export function boardVisibilityFilter(session: SessionData | null) {
  if (canModerate(session)) return {};

  const ladder: Role[] = ["MEMBER", "STAFF", "HEAD", "ADMIN", "DEVELOPER"];
  const reachable = session ? ladder.filter((role) => hasRole(session, role)) : [];
  const readable = [{ readRole: null }, { readRole: { in: reachable } }];

  return {
    visible: true,
    OR: readable,
    AND: [{ OR: [{ parentId: null }, { parent: { visible: true, OR: readable } }] }],
  };
}
