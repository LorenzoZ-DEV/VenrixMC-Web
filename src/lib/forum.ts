import type { Prisma, Role, StaffRole } from "@prisma/client";
import { prisma } from "./prisma";
import { cached, TTL } from "./cache";
import { keys, redis } from "./redis";
import { ROLE_RANK } from "./roles";
import { boardVisibilityFilter, canModerate } from "./forumPermissions";
import type { SessionData } from "./session";

export const TOPICS_PER_PAGE = 20;
export const POSTS_PER_PAGE = 15;
export const MEMBERS_PER_PAGE = 24;

/** Campi di un autore che servono a disegnare la colonna di sinistra di un post. */
export const AUTHOR_SELECT = {
  id: true,
  username: true,
  role: true,
  discordRank: true,
  discordAvatar: true,
  minecraftName: true,
  postCount: true,
  signature: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type ForumAuthor = Prisma.UserGetPayload<{ select: typeof AUTHOR_SELECT }>;

const TAG_SELECT = { id: true, name: true, slug: true, color: true } satisfies Prisma.ForumTagSelect;

/**
 * Chi sta scrivendo. Lo stato di mute non sta nel cookie di sessione ma sulla
 * riga `users`, cosi silenziare qualcuno ha effetto al messaggio successivo e
 * non alla scadenza del cookie; per questo ogni rotta di scrittura parte da
 * qui invece che dalla sola `getSession()`.
 */
export async function getForumActor(session: SessionData | null) {
  if (!session) return { session: null, muted: false, user: null };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, active: true, forumMuted: true, username: true },
  });

  if (!user || !user.active) return { session: null, muted: false, user: null };
  return { session, muted: user.forumMuted, user };
}

// ---------------------------------------------------------------------------
//  Pagina indice
// ---------------------------------------------------------------------------

/**
 * Categorie con dentro i loro forum e, per ognuno, numero di discussioni,
 * numero di messaggi e ultima discussione aggiornata.
 *
 * I contatori non sono denormalizzati sul board: si calcolano qui con due
 * aggregazioni e si tengono in cache un minuto. Un contatore in tabella
 * andrebbe mantenuto coerente a ogni cancellazione, spostamento o purge, e
 * su un forum di questa taglia non vale il prezzo.
 */
export async function getForumIndex(session: SessionData | null) {
  const gate = boardVisibilityFilter(session);
  // La cache deve distinguere cosa vede un ospite da cosa vede lo staff.
  const scope = session ? `role-${session.role}` : "guest";

  return cached(keys.cache("forum", `index-${scope}`), TTL.FORUM_INDEX, async () => {
    const categories = await prisma.forumCategory.findMany({
      where: canModerate(session) ? {} : { visible: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        boards: {
          // Solo il primo livello: le sotto-sezioni arrivano annidate dentro
          // il rispettivo padre, non come righe a se stanti nella categoria.
          where: { ...gate, parentId: null },
          orderBy: [{ order: "asc" }, { name: "asc" }],
          include: {
            children: {
              where: gate,
              orderBy: [{ order: "asc" }, { name: "asc" }],
            },
          },
        },
      },
    });

    const boards = categories.flatMap((c) => c.boards);
    // I contatori e l'ultimo messaggio servono anche per le sotto-sezioni:
    // vanno interrogate insieme ai padri, in un colpo solo.
    const boardIds = boards.flatMap((b) => [b.id, ...b.children.map((c) => c.id)]);

    const [grouped, lastTopics] = await Promise.all([
      boardIds.length
        ? prisma.forumTopic.groupBy({
            by: ["boardId"],
            where: { boardId: { in: boardIds } },
            _count: { _all: true },
            _sum: { replyCount: true },
          })
        : Promise.resolve([]),
      Promise.all(
        boardIds.map((boardId) =>
          prisma.forumTopic.findFirst({
            where: { boardId },
            orderBy: { lastPostAt: "desc" },
            select: {
              title: true,
              slug: true,
              lastPostAt: true,
              board: { select: { slug: true } },
              lastPostBy: { select: { username: true, discordAvatar: true, minecraftName: true } },
              author: { select: { username: true, discordAvatar: true, minecraftName: true } },
            },
          })
        )
      ),
    ]);

    const statsByBoard = new Map(
      grouped.map((row) => [
        row.boardId,
        { topics: row._count._all, posts: row._count._all + (row._sum.replyCount ?? 0) },
      ])
    );
    const lastByBoard = new Map(boardIds.map((id, i) => [id, lastTopics[i]]));

    const zero = { topics: 0, posts: 0 };
    const shape = (board: (typeof boards)[number] | (typeof boards)[number]["children"][number]) => ({
      id: board.id,
      name: board.name,
      slug: board.slug,
      description: board.description,
      icon: board.icon,
      locked: board.locked,
      visible: board.visible,
      readRole: board.readRole,
      stats: statsByBoard.get(board.id) ?? zero,
      lastTopic: lastByBoard.get(board.id) ?? null,
    });

    return categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        boards: category.boards.map((board) => {
          const children = board.children.map(shape);
          const own = statsByBoard.get(board.id) ?? zero;

          return {
            ...shape(board),
            children,
            /*
             * Il totale mostrato accanto a un forum padre comprende le sue
             * sotto-sezioni: chi guarda l'indice si aspetta di vedere quanto
             * si muove l'area nel suo complesso, non quanto si muove il solo
             * contenitore — che spesso e vuoto di suo.
             */
            stats: children.reduce(
              (acc, child) => ({
                topics: acc.topics + child.stats.topics,
                posts: acc.posts + child.stats.posts,
              }),
              own
            ),
            /* Idem per l'ultimo messaggio: il piu recente dell'intero ramo. */
            lastTopic: [shape(board).lastTopic, ...children.map((c) => c.lastTopic)]
              .filter((t): t is NonNullable<typeof t> => t !== null)
              .sort((a, b) => +new Date(b.lastPostAt) - +new Date(a.lastPostAt))[0] ?? null,
          };
        }),
      }))
      .filter((category) => category.boards.length > 0);
  });
}

/** Contatori del riquadro "Statistiche" in fondo all'indice. */
export async function getForumStats() {
  return cached(keys.cache("forum", "stats"), TTL.FORUM_STATS, async () => {
    const [topics, posts, members, newest] = await Promise.all([
      prisma.forumTopic.count(),
      prisma.forumPost.count(),
      prisma.user.count({ where: { active: true } }),
      prisma.user.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        select: { username: true },
      }),
    ]);

    return { topics, posts, members, newestMember: newest?.username ?? null };
  });
}

/** Ultime discussioni aggiornate, per la colonna laterale dell'indice. */
export async function getLatestTopics(session: SessionData | null, take = 6) {
  const gate = boardVisibilityFilter(session);
  const scope = session ? `role-${session.role}` : "guest";

  return cached(keys.cache("forum", `latest-${scope}-${take}`), TTL.FORUM_INDEX, async () =>
    prisma.forumTopic.findMany({
      where: { board: gate },
      orderBy: { lastPostAt: "desc" },
      take,
      select: {
        title: true,
        slug: true,
        lastPostAt: true,
        replyCount: true,
        board: { select: { name: true, slug: true } },
        author: { select: { username: true, discordAvatar: true, minecraftName: true } },
        tags: { select: TAG_SELECT, orderBy: { order: "asc" } },
      },
    })
  );
}

/** Butta via tutto il derivato dell'indice: chiamata a ogni scrittura. */
export async function invalidateForumIndex() {
  const stream = redis.scanStream({ match: `${keys.cache("forum", "")}*`, count: 100 });
  const toDelete: string[] = [];
  for await (const chunk of stream) toDelete.push(...(chunk as string[]));
  if (toDelete.length) await redis.del(...toDelete);
}

// ---------------------------------------------------------------------------
//  Board e discussioni
// ---------------------------------------------------------------------------

export async function getBoardBySlug(slug: string) {
  return prisma.forumBoard.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { select: TAG_SELECT, orderBy: { order: "asc" } },
      // Il padre serve alle briciole di pane e al controllo dei permessi
      // ereditati; le figlie si elencano in testa alla pagina del forum.
      parent: { select: { id: true, name: true, slug: true, visible: true, readRole: true } },
      children: { orderBy: [{ order: "asc" }, { name: "asc" }] },
    },
  });
}

/**
 * Contatori delle sotto-sezioni elencate in testa a un forum padre.
 * Stessa forma di quelli dell'indice, ma calcolati solo per i figli mostrati.
 */
export async function getChildBoardStats(boardIds: string[]) {
  if (!boardIds.length) return new Map<string, { topics: number; posts: number }>();

  const grouped = await prisma.forumTopic.groupBy({
    by: ["boardId"],
    where: { boardId: { in: boardIds } },
    _count: { _all: true },
    _sum: { replyCount: true },
  });

  return new Map(
    grouped.map((row) => [
      row.boardId,
      { topics: row._count._all, posts: row._count._all + (row._sum.replyCount ?? 0) },
    ])
  );
}

/**
 * Controlla che un forum possa davvero stare sotto il padre richiesto.
 *
 * Le regole sono tre e servono tutte a tenere l'albero a un solo livello e
 * coerente: il padre deve esistere ed essere di primo livello, deve stare
 * nella stessa categoria (altrimenti le briciole di pane mentirebbero), e un
 * forum che ha gia delle figlie non puo diventare figlio a sua volta.
 */
export async function validateParentBoard(opts: {
  parentId: string | null;
  categoryId: string;
  /** Presente in modifica: il forum che si sta spostando. */
  boardId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { parentId, categoryId, boardId } = opts;
  if (!parentId) return { ok: true };

  if (boardId && parentId === boardId) {
    return { ok: false, error: "Un forum non può essere sotto-sezione di se stesso" };
  }

  const parent = await prisma.forumBoard.findUnique({
    where: { id: parentId },
    select: { id: true, categoryId: true, parentId: true },
  });
  if (!parent) return { ok: false, error: "Il forum padre non esiste" };

  if (parent.parentId) {
    return { ok: false, error: "Le sotto-sezioni non possono essere annidate oltre un livello" };
  }
  if (parent.categoryId !== categoryId) {
    return { ok: false, error: "Il forum padre deve stare nella stessa categoria" };
  }

  if (boardId) {
    const children = await prisma.forumBoard.count({ where: { parentId: boardId } });
    if (children > 0) {
      return {
        ok: false,
        error: "Questo forum ha delle sotto-sezioni: spostale prima di renderlo a sua volta una sotto-sezione",
      };
    }
  }

  return { ok: true };
}

/**
 * Etichette utilizzabili in un board: quelle assegnate esplicitamente a
 * questo forum piu quelle globali (create senza indicare nessun board).
 */
export async function getBoardTags(boardId: string, includeStaffOnly = true) {
  return prisma.forumTag.findMany({
    where: {
      OR: [{ boards: { none: {} } }, { boards: { some: { id: boardId } } }],
      ...(includeStaffOnly ? {} : { staffOnly: false }),
    },
    select: { ...TAG_SELECT, staffOnly: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

/**
 * Filtra le etichette richieste da un form: devono esistere, essere
 * disponibili in quel forum e, se marcate `staffOnly`, arrivare da uno dello
 * staff. Torna solo gli id superstiti, cosi chi chiama puo collegarli senza
 * altri controlli.
 */
export async function allowedTagIds(
  tagIds: string[],
  boardId: string,
  moderator: boolean
): Promise<string[]> {
  if (!tagIds.length) return [];

  const tags = await prisma.forumTag.findMany({
    where: {
      id: { in: tagIds },
      OR: [{ boards: { none: {} } }, { boards: { some: { id: boardId } } }],
      ...(moderator ? {} : { staffOnly: false }),
    },
    select: { id: true },
  });

  return tags.map((t) => t.id);
}

export async function getBoardTopics(boardId: string, page: number, tagSlug?: string) {
  const safePage = Math.max(1, page);
  const where: Prisma.ForumTopicWhereInput = {
    boardId,
    ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.forumTopic.findMany({
      where,
      // I pin restano in cima, il resto scorre per ultima risposta.
      orderBy: [{ pinned: "desc" }, { lastPostAt: "desc" }],
      skip: (safePage - 1) * TOPICS_PER_PAGE,
      take: TOPICS_PER_PAGE,
      select: {
        id: true,
        title: true,
        slug: true,
        pinned: true,
        locked: true,
        views: true,
        replyCount: true,
        createdAt: true,
        lastPostAt: true,
        // `role` serve al badge di rank: getStaffRanks lo usa per non dare un
        // rank a chi si e solo scritto il nick di uno staffer nel profilo.
        author: {
          select: { username: true, role: true, discordRank: true, discordAvatar: true, minecraftName: true },
        },
        lastPostBy: { select: { username: true, discordAvatar: true, minecraftName: true } },
        tags: { select: TAG_SELECT, orderBy: { order: "asc" } },
      },
    }),
    prisma.forumTopic.count({ where }),
  ]);

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / TOPICS_PER_PAGE)),
  };
}

export async function getTopicBySlug(slug: string) {
  return prisma.forumTopic.findUnique({
    where: { slug },
    include: {
      author: { select: AUTHOR_SELECT },
      tags: { select: TAG_SELECT, orderBy: { order: "asc" } },
      board: {
        include: {
          category: { select: { name: true, slug: true } },
          // Serve a canViewBoard: senza il padre l'ereditarieta dei permessi
          // non verrebbe applicata e basterebbe l'URL di una discussione per
          // leggere dentro una sotto-sezione riservata.
          parent: { select: { id: true, name: true, slug: true, visible: true, readRole: true } },
        },
      },
    },
  });
}

export async function getTopicPosts(topicId: string, page: number, viewerId?: string) {
  const safePage = Math.max(1, page);

  const [items, total] = await Promise.all([
    prisma.forumPost.findMany({
      where: { topicId },
      orderBy: { createdAt: "asc" },
      skip: (safePage - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
      include: {
        author: { select: AUTHOR_SELECT },
        editedBy: { select: { username: true } },
        reactions: { select: { type: true, userId: true } },
      },
    }),
    prisma.forumPost.count({ where: { topicId } }),
  ]);

  return {
    items: items.map((post) => ({
      ...post,
      // Le reazioni arrivano grezze: qui diventano "quante per tipo" piu
      // "quella che ho messo io", che e tutto cio che serve ai bottoni.
      reactionCounts: post.reactions.reduce<Record<string, number>>((acc, r) => {
        acc[r.type] = (acc[r.type] ?? 0) + 1;
        return acc;
      }, {}),
      myReaction: viewerId
        ? (post.reactions.find((r) => r.userId === viewerId)?.type ?? null)
        : null,
    })),
    total,
    totalPages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
  };
}

/**
 * Conta una visualizzazione al massimo una volta all'ora per visitatore,
 * altrimenti basta ricaricare la pagina per gonfiare il contatore.
 */
export async function registerTopicView(topicId: string, viewerKey: string) {
  const key = keys.cache("forum-view", `${topicId}:${viewerKey}`);
  const fresh = await redis.set(key, "1", "EX", 3600, "NX");
  if (!fresh) return;

  await prisma.forumTopic.update({
    where: { id: topicId },
    data: { views: { increment: 1 } },
  });
}

// ---------------------------------------------------------------------------
//  Ricerca e membri
// ---------------------------------------------------------------------------

export async function searchTopics(session: SessionData | null, query: string, page: number) {
  const safePage = Math.max(1, page);
  const gate = boardVisibilityFilter(session);
  const where: Prisma.ForumTopicWhereInput = {
    board: gate,
    OR: [{ title: { contains: query } }, { posts: { some: { content: { contains: query } } } }],
  };

  const [items, total] = await Promise.all([
    prisma.forumTopic.findMany({
      where,
      orderBy: { lastPostAt: "desc" },
      skip: (safePage - 1) * TOPICS_PER_PAGE,
      take: TOPICS_PER_PAGE,
      select: {
        title: true,
        slug: true,
        replyCount: true,
        views: true,
        lastPostAt: true,
        board: { select: { name: true, slug: true } },
        author: { select: { username: true, discordAvatar: true, minecraftName: true } },
        tags: { select: TAG_SELECT, orderBy: { order: "asc" } },
        posts: {
          where: { opening: true },
          take: 1,
          select: { content: true },
        },
      },
    }),
    prisma.forumTopic.count({ where }),
  ]);

  return { items, total, totalPages: Math.max(1, Math.ceil(total / TOPICS_PER_PAGE)) };
}

export async function getMembersPage(page: number, query?: string) {
  const safePage = Math.max(1, page);
  const where: Prisma.UserWhereInput = {
    active: true,
    ...(query ? { username: { contains: query } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ postCount: "desc" }, { createdAt: "asc" }],
      skip: (safePage - 1) * MEMBERS_PER_PAGE,
      take: MEMBERS_PER_PAGE,
      select: AUTHOR_SELECT,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, totalPages: Math.max(1, Math.ceil(total / MEMBERS_PER_PAGE)) };
}

export async function getMemberProfile(username: string) {
  const user = await prisma.user.findFirst({
    where: { username, active: true },
    select: { ...AUTHOR_SELECT, bio: true, lastSeenAt: true, discordUsername: true },
  });
  if (!user) return null;

  const [topics, recentPosts] = await Promise.all([
    prisma.forumTopic.count({ where: { authorId: user.id } }),
    prisma.forumPost.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        content: true,
        createdAt: true,
        topic: { select: { title: true, slug: true, board: { select: { slug: true } } } },
      },
    }),
  ]);

  return { user, topics, recentPosts };
}

// ---------------------------------------------------------------------------
//  Rank dalla lista staff
// ---------------------------------------------------------------------------

export type RankCandidate = {
  username: string;
  minecraftName?: string | null;
  role: Role;
  discordRank?: StaffRole | null;
};

/**
 * Badge mostrato accanto al nome nei post. Non e il `Role` dell'account (che
 * dice cosa puo fare in dashboard) ma il rank in gioco: quello che la
 * community riconosce. Due fonti, in quest'ordine:
 *
 *  1. `discordRank`, letto dai ruoli sul server Discord a ogni accesso: e
 *     verificato, quindi vince sempre.
 *  2. La vetrina /staff, cercata per nick Minecraft (o username). Vale **solo
 *     per chi e gia staff** (account STAFF+ o ruolo staff su Discord): il nick
 *     se lo scrive il membro da solo, e senza questo filtro basterebbe
 *     dichiararsi "Venrix__" per farsi stampare accanto un badge da Owner.
 *
 * La mappa e indicizzata con rankKey(), cioe per account e non per nick,
 * cosi un omonimo non eredita il badge di qualcun altro.
 */
export async function getStaffRanks(users: RankCandidate[]): Promise<Map<string, StaffRole>> {
  const trusted = users.filter(
    (user) => user.discordRank || ROLE_RANK[user.role] >= ROLE_RANK.STAFF
  );
  if (!trusted.length) return new Map();

  const nicks = Array.from(new Set(trusted.map(staffNick).filter(Boolean)));
  const members = nicks.length
    ? await prisma.staffMember.findMany({
        where: { visible: true, username: { in: nicks } },
        select: { username: true, role: true },
      })
    : [];
  const byNick = new Map(members.map((m) => [m.username.toLowerCase(), m.role]));

  const ranks = new Map<string, StaffRole>();
  for (const user of trusted) {
    const rank = user.discordRank ?? byNick.get(staffNick(user));
    if (rank) ranks.set(rankKey(user), rank);
  }
  return ranks;
}

/** Il nick con cui cercare nella vetrina: quello Minecraft se c'e, altrimenti l'username. */
function staffNick(user: { username: string; minecraftName?: string | null }): string {
  return (user.minecraftName ?? user.username).toLowerCase();
}

/** Chiave della mappa di getStaffRanks: l'account (username e unico). */
export function rankKey(user: { username: string }): string {
  return user.username.toLowerCase();
}

/**
 * Un nick Minecraft presente nella vetrina staff puo dichiararlo solo chi e
 * staff davvero; e in ogni caso un nick appartiene a un solo account.
 * Torna il messaggio d'errore, o null se il nick si puo usare.
 */
export async function checkMinecraftNick(
  userId: string,
  nick: string,
  user: { role: Role; discordRank: StaffRole | null }
): Promise<string | null> {
  const taken = await prisma.user.findFirst({
    where: { minecraftName: nick, NOT: { id: userId } },
    select: { id: true },
  });
  if (taken) return "Questo nick Minecraft è già usato da un altro account.";

  const isStaff = Boolean(user.discordRank) || ROLE_RANK[user.role] >= ROLE_RANK.STAFF;
  if (!isStaff) {
    const staffEntry = await prisma.staffMember.findFirst({
      where: { username: nick },
      select: { id: true },
    });
    if (staffEntry) {
      return "Questo nick appartiene a un membro dello staff. Se sei tu, accedi con il Discord che ha il ruolo staff.";
    }
  }
  return null;
}
