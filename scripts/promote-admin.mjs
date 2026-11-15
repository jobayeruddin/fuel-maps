import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/promote-admin.mjs <email>");
  process.exit(1);
}

const url = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
});
const prisma = new PrismaClient({ adapter });

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.error(`No user found with email ${email}`);
  process.exit(1);
}

await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
console.log(`Promoted ${user.email} (${user.name}) to ADMIN`);
await prisma.$disconnect();