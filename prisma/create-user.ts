/**
 * One-off CLI to create (or update) a single user directly in the DB —
 * useful to bootstrap the first account on a fresh production database,
 * before anyone can log in to use the dashboard's user management.
 *
 * Usage: npx tsx prisma/create-user.ts <username> <email> <password> [ROLE]
 * ROLE: STAFF | HEAD | ADMIN | DEVELOPER (default DEVELOPER)
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [username, email, password, roleArg] = process.argv.slice(2);

  if (!username || !email || !password) {
    console.error("Uso: npx tsx prisma/create-user.ts <username> <email> <password> [ROLE]");
    console.error(`ROLE: ${Object.values(Role).join(" | ")} (default DEVELOPER)`);
    process.exit(1);
  }

  const role = (roleArg?.toUpperCase() as Role) || Role.DEVELOPER;
  if (!Object.values(Role).includes(role)) {
    console.error(`Ruolo non valido: "${roleArg}". Usa uno tra: ${Object.values(Role).join(", ")}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { username, passwordHash, role },
    create: { username, email, passwordHash, role },
  });

  console.log("Utente pronto:", { id: user.id, username: user.username, email: user.email, role: user.role });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
