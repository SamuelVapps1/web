import type { NextRequest, NextResponse } from 'next/server';
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
    },
  };
}

export function createSupabaseProxyClient(
  request: NextRequest,
  response: NextResponse
) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createMissingSupabaseClient();
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieSetValue[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
