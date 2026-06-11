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

function getConnectionHost(connectionString: string): string {
  try {
    return new URL(connectionString).hostname;
  } catch {
    return '';
  }
}

function isUsableConnectionString(connectionString: string | undefined): boolean {
  if (!connectionString) {
    return false;
  }

  const host = getConnectionHost(connectionString);
  return Boolean(host) && host !== 'base';
}

function resolveConnectionString(): { value: string; source: 'DATABASE_URL' | 'DIRECT_URL' } {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (isUsableConnectionString(databaseUrl)) {
    return { value: sanitizeConnectionString(databaseUrl as string), source: 'DATABASE_URL' };
  }

  if (isUsableConnectionString(directUrl)) {
    return { value: sanitizeConnectionString(directUrl as string), source: 'DIRECT_URL' };
  }

  if (databaseUrl) {
    return { value: sanitizeConnectionString(databaseUrl), source: 'DATABASE_URL' };
  }

  if (directUrl) {
    return { value: sanitizeConnectionString(directUrl), source: 'DIRECT_URL' };
  }

  throw new Error('DATABASE_URL or DIRECT_URL is required to initialize Prisma.');
}

function createPrismaClient() {
  const { value: connectionString, source } = resolveConnectionString();
  const host = getConnectionHost(connectionString);

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[prisma] using ${source} host=${host || 'unknown'}`);
  } else if (source === 'DIRECT_URL' || host === 'base') {
    console.warn(`[prisma] using ${source} host=${host || 'unknown'}`);
  }

  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
      connectionString,
    });
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
