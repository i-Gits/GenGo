// ╭───────────────────────────────· · ୨୧ · · ─────────────────╮
//   Prisma Client Singleton
//   "one gardener per garden" 🌻
// ╰───────────────────────────────· · ୨୧ · · ─────────────────╯

// ── What is a singleton? ────────────────────────────────────
// A singleton is a design pattern where only ONE instance of
// something exists in the entire app. Like having one gardener
// for one garden -- you don't hire 50 gardeners.
//
// 🧠 Java analogy:
//   public class DatabaseConnection {
//     private static DatabaseConnection instance;
//     public static DatabaseConnection getInstance() { ... }
//   }
//
// In Next.js development mode, the server restarts often
// (hot reload). Without the singleton pattern, each restart
// would create a NEW database connection -- eventually you'd
// run out of connections. This pattern prevents that.

// ── Prisma 7 requires a "driver adapter" ────────────────────
// In older Prisma, you just put the DB URL in the schema file.
// In Prisma 7, you create an adapter (a bridge between Prisma
// and the actual PostgreSQL driver) and pass it to PrismaClient.
//
// Think of it like: Prisma speaks "Prisma language", PostgreSQL
// speaks "SQL language", and the adapter is the translator~

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set! Check your .env file~ 🌱"
    );
  }

  // The adapter bridges Prisma <-> PostgreSQL
  const adapter = new PrismaPg({ connectionString });

  // We cast through unknown because Prisma 7's types are strict
  // about the adapter generic -- this is a known pattern.
  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
