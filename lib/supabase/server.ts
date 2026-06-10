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

  return createServerClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_ANON_KEY ?? '',
    {
      cookies: buildCookieAdapter(cookieStore, mutable),
    }
  );
}
