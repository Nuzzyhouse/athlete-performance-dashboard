import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_OWNER_EMAIL ?? "coach@example.com";
  const name = process.env.SEED_OWNER_NAME ?? "Head Coach";
  const password = process.env.SEED_OWNER_PASSWORD ?? "changeme123";

  const passwordHash = await bcrypt.hash(password, 12);

  const owner = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash,
      role: "owner",
      mustChangePassword: true,
    },
  });

  console.log(`Seeded owner account: ${owner.email} / password: ${password}`);
  console.log("You will be required to change this password on first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
