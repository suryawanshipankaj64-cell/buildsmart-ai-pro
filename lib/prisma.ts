import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  walInitialized: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

// If using SQLite locally, configure WAL mode. (PostgreSQL on Supabase handles concurrency automatically)
if (!globalForPrisma.walInitialized) {
  globalForPrisma.walInitialized = true;
  if (process.env.DATABASE_URL?.startsWith('file:')) {
    prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
      .then(() => prisma.$queryRawUnsafe('PRAGMA busy_timeout = 10000;'))
      .then(() => prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;'))
      .catch((err) => console.error('PRAGMA WAL init error:', err));
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;