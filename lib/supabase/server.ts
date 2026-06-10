import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

type CookieSetValue = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    path?: string;
    sameSite?: 'lax' | 'strict' | 'none' | boolean;
    secure?: boolean;
    httpOnly?: boolean;
    expires?: Date;
    maxAge?: number;
  };
};

function createMissingSupabaseClient() {
  const missingConfigError = new Error(
    'Supabase configuration is missing. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
  );

  return {
    auth: {
      async getUser() {
        return {
          data: { user: null },
          error: missingConfigError,
        };
      },
      async signInWithPassword() {
        return {
          data: { user: null, session: null },
          error: missingConfigError,
        };
      },
      async signOut() {
        return {
          error: missingConfigError,
        };
      },
    },
  };
}

function buildCookieAdapter(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  mutable: boolean
) {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: CookieSetValue[]) {
      if (!mutable) {
        return;
      }

      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options);
      });
    },
  };
}

export async function createSupabaseServerClient(options?: {
  mutable?: boolean;
}) {
  const cookieStore = await cookies();
  const mutable = options?.mutable ?? false;
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createMissingSupabaseClient();
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: buildCookieAdapter(cookieStore, mutable),
    }
  );
}
