import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  // Local `prisma dev` recycles idle backends aggressively — keep the pool's idle
  // timeout as small as possible so it never holds a connection the server already
  // dropped. A real hosted Postgres doesn't need this, but it's harmless there too.
  idleTimeoutMillis: 1_000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
