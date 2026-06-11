import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  pool?: Pool;
  prisma?: PrismaClient;
};

function sanitizeConnectionString(raw: string): string {
  return raw.trim().replace(/^["']+|["']+$/g, '');
}

function parseConnectionString(connectionString: string): URL {
  return new URL(connectionString);
}

function createPrismaClient() {
  const rawDatabaseUrl = process.env.DATABASE_URL;

  if (!rawDatabaseUrl) {
    throw new Error('DATABASE_URL is required to initialize Prisma.');
  }

  const connectionString = sanitizeConnectionString(rawDatabaseUrl);
  const parsed = parseConnectionString(connectionString);
  const user = parsed.username || 'unknown';
  const host = parsed.hostname || 'unknown';
  const port = parsed.port || 'unknown';

  console.info(`[prisma] user=${user} host=${host} port=${port}`);

  if (!globalForPrisma.pool) {
    const pool = new Pool({
      connectionString,
    });

    globalForPrisma.pool = pool;
  }

  const pool = globalForPrisma.pool;

  if (!pool) {
    throw new Error('Prisma pool initialization failed.');
  }

  return new PrismaClient({
    adapter: new PrismaPg(pool as never),
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}
