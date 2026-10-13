import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { INITIAL_STAFF } from "./staff-seed";
import { INITIAL_FORUM, INITIAL_FORUM_TAGS } from "./forum-seed";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("VenrixDev123!", 12);

  const dev = await prisma.user.upsert({
    where: { email: "dev@venrixmc.uk" },
    update: {},
    create: {
      username: "developer",
      email: "dev@venrixmc.uk",
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@venrixmc.uk" },
    update: {},
    create: {
      username: "admin",
      email: "admin@venrixmc.uk",
      passwordHash: await bcrypt.hash("VenrixAdmin123!", 12),
      role: Role.ADMIN,
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "rules_content" },
    update: {},
    create: {
      key: "rules_content",
      value:
        "<h2>Regolamento Generale</h2><p>Benvenuto su VenrixMC. Rispetta gli altri giocatori e lo staff.</p>",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "site_colors" },
    update: {},
    create: {
      key: "site_colors",
      value: JSON.stringify({ primary: "#7c3aed", primaryDark: "#6d28d9" }),
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "social_links" },
    update: {},
    create: {
      key: "social_links",
      value: JSON.stringify({
        discord: "https://discord.gg/sDhGS4EVJw",
        store: "https://store.venrixmc.uk/",
        tiktok: "",
        youtube: "",
      }),
    },
  });

  const positions = [
    {
      slug: "helper-supporter",
      title: "Helper Supporter",
      tagline: "Prima linea in chat: aiuta i nuovi giocatori e segnala i problemi allo staff.",
      icon: "chat",
      slots: 3,
      open: true,
      wizardId: "helper-supporter",
      order: 0,
      requirements: [
        "ALMENO 14 ANNI (compiuti)",
        "Microfono funzionante per il colloquio Discord",
        "Buona conoscenza dell'italiano scritto",
        "Non ricoprire ruoli staff attivi su altri server",
      ],
    },
    {
      slug: "helper-ss",
      title: "Helper SS",
      tagline: "Esegue i controlli Screen Share via AnyDesk/Echo per verificare i sospetti di cheat.",
      icon: "search",
      slots: 2,
      open: true,
      wizardId: "helper-ss",
      order: 1,
      requirements: [
        "ALMENO 15/16 ANNI (consigliati)",
        "Microfono funzionante + AnyDesk/Echo per le sessioni di controllo",
        "Conoscenza base di strumenti anti-cheat (Echo, BLS, Process Hacker...)",
        "Capacità di riconoscere Reach, Velocity e Autoclicker",
      ],
    },
    {
      slug: "moderator",
      title: "Moderator",
      tagline: "Gestisce segnalazioni, sanzioni e la sicurezza della community in game.",
      icon: "shield",
      slots: 2,
      open: true,
      wizardId: null,
      order: 2,
      requirements: [
        "ALMENO 16 ANNI (compiuti)",
        "Esperienza pregressa come staff verificabile",
        "Disponibilità minima di 8 ore/settimana",
        "Conoscenza base del plugin LiteBans",
      ],
    },
    {
      slug: "builder",
      title: "Builder",
      tagline: "Progetta e realizza le strutture usate per eventi, spawn e mappe a tema.",
      icon: "hammer",
      slots: 1,
      open: true,
      wizardId: "builder",
      order: 3,
      requirements: [
        "Portfolio di build precedenti (screenshot o server)",
        "Familiarità con WorldEdit",
        "Capacità di lavorare in team su progetti condivisi",
      ],
    },
    {
      slug: "developer",
      title: "Developer",
      tagline: "Sviluppa e mantiene i plugin custom del server.",
      icon: "code",
      slots: 0,
      open: false,
      wizardId: null,
      order: 4,
      requirements: [
        "Esperienza con Java e l'API Spigot/Paper",
        "Repository pubblico con progetti mostrabili",
        "Account Minecraft Premium",
      ],
    },
  ];

  for (const position of positions) {
    await prisma.staffPosition.upsert({
      where: { slug: position.slug },
      update: {},
      create: position,
    });
  }

  await prisma.news.upsert({
    where: { slug: "benvenuti-su-venrixmc" },
    update: {},
    create: {
      title: "Benvenuti su VenrixMC!",
      slug: "benvenuti-su-venrixmc",
      excerpt: "Il server e' finalmente online, scopri tutte le novita'.",
      content:
        "<p>Siamo felici di annunciare l'apertura ufficiale di <strong>VenrixMC</strong>. Unisciti a noi su <code>play.venrixmc.uk</code>.</p>",
      published: true,
      authorId: dev.id,
    },
  });

  // Formazione iniziale del team: `update: {}` fa si che rieseguire il seed
  // non sovrascriva le modifiche fatte nel frattempo dalla dashboard.
  for (const member of INITIAL_STAFF) {
    await prisma.staffMember.upsert({
      where: { username: member.username },
      update: {},
      create: member,
    });
  }

  // Etichette prima dei forum: un'etichetta senza board collegati vale
  // ovunque, ed e esattamente quello che serve a una struttura appena nata.
  for (const tag of INITIAL_FORUM_TAGS) {
    await prisma.forumTag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }

  let boardCount = 0;
  for (const category of INITIAL_FORUM) {
    const { boards, ...data } = category;
    const saved = await prisma.forumCategory.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });

    for (const board of boards) {
      await prisma.forumBoard.upsert({
        where: { slug: board.slug },
        update: {},
        create: { ...board, categoryId: saved.id },
      });
      boardCount += 1;
    }
  }

  console.log("Seed completato:", {
    dev: dev.email,
    admin: admin.email,
    staff: INITIAL_STAFF.length,
    forum: `${INITIAL_FORUM.length} categorie, ${boardCount} sezioni, ${INITIAL_FORUM_TAGS.length} etichette`,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
