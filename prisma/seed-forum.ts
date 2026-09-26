/**
 * Seed della sola struttura del forum: categorie, sezioni ed etichette.
 *
 * Esiste separato da `seed.ts` perche quello crea anche gli account di
 * servizio (dev@/admin@) con password di default: utile su una macchina di
 * sviluppo vuota, pericoloso da lanciare su un database di produzione dove
 * quegli account potrebbero non esistere piu. Qui si tocca solo il forum.
 *
 * Idempotente (upsert sullo slug): rilanciarlo non crea doppioni e non
 * sovrascrive le modifiche fatte nel frattempo da /dashboard/forum.
 *
 *   npm run db:seed-forum
 */
import { PrismaClient } from "@prisma/client";
import { INITIAL_FORUM, INITIAL_FORUM_TAGS } from "./forum-seed";

const prisma = new PrismaClient();

async function main() {
  // Etichette prima delle sezioni: un'etichetta senza board collegati vale
  // ovunque, ed e esattamente quello che serve a un forum appena nato.
  for (const tag of INITIAL_FORUM_TAGS) {
    await prisma.forumTag.upsert({ where: { slug: tag.slug }, update: {}, create: tag });
  }

  let boards = 0;
  for (const category of INITIAL_FORUM) {
    const { boards: categoryBoards, ...data } = category;

    const saved = await prisma.forumCategory.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });

    for (const board of categoryBoards) {
      await prisma.forumBoard.upsert({
        where: { slug: board.slug },
        update: {},
        create: { ...board, categoryId: saved.id },
      });
      boards += 1;
    }
  }

  console.log(
    `Forum pronto: ${INITIAL_FORUM.length} categorie, ${boards} sezioni, ${INITIAL_FORUM_TAGS.length} etichette.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
