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

export function createSupabaseProxyClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_ANON_KEY ?? '',
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
