import { Pool } from 'pg';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEBUG_KEY = 'laura-debug-2026';

function sanitizeConnectionString(raw: string): string {
  return raw.trim().replace(/^["']+|["']+$/g, '');
}

function parseMaskedConnectionString(raw: string | undefined) {
  if (!raw) {
    return null;
  }

  const sanitized = sanitizeConnectionString(raw);

  try {
    const parsed = new URL(sanitized);

    return {
      user: parsed.username || null,
      host: parsed.hostname || null,
      port: parsed.port || null,
      db: parsed.pathname.replace(/^\//, '') || null,
      query: Object.fromEntries(parsed.searchParams.entries()),
      passwordLength: parsed.password.length,
    };
  } catch (error) {
    return {
      parseError: error instanceof Error ? error.message : 'Failed to parse connection string',
      first12: sanitized.slice(0, 12),
    };
  }
}

async function liveTestConnection() {
  const rawDatabaseUrl = process.env.DATABASE_URL;

  if (!rawDatabaseUrl) {
    return {
      code: 'MISSING_DATABASE_URL',
      message: 'DATABASE_URL is missing',
    };
  }

  const connectionString = sanitizeConnectionString(rawDatabaseUrl);
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    await pool.query('SELECT 1');
    return { ok: true };
  } catch (error) {
    return {
      code: error instanceof Error && 'code' in error ? String((error as { code?: unknown }).code ?? 'UNKNOWN') : 'UNKNOWN',
      message: error instanceof Error ? error.message : 'Unknown database error',
    };
  } finally {
    await pool.end().catch(() => undefined);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get('key') !== DEBUG_KEY) {
    return new Response(null, { status: 404 });
  }

  const [databaseUrl, directUrl, liveTest] = await Promise.all([
    Promise.resolve(parseMaskedConnectionString(process.env.DATABASE_URL)),
    Promise.resolve(parseMaskedConnectionString(process.env.DIRECT_URL)),
    liveTestConnection(),
  ]);

  return NextResponse.json({
    databaseUrl,
    directUrl,
    liveTest,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  });
}
