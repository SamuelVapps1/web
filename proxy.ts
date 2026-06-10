import { NextResponse, type NextRequest } from 'next/server';
import { isValidDiaryAuth } from '@/lib/auth';
import { createSupabaseProxyClient } from '@/lib/supabase/proxy';
import {
  buildAdminLoginRedirectPath,
  isAdminLoginPath,
  isProtectedAdminPath,
} from '@/lib/admin-paths';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/diar')) {
    const header = request.headers.get('authorization');
    const user = process.env.DIAR_USER;
    const pass = process.env.DIAR_PASS;

    if (isValidDiaryAuth(header, user, pass)) {
      return NextResponse.next();
    }

    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Diár", charset="UTF-8"',
      },
    });
  }

  if (!isProtectedAdminPath(pathname) || isAdminLoginPath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createSupabaseProxyClient(request, response);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    const redirectUrl = new URL(buildAdminLoginRedirectPath(pathname), request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/diar/:path*', '/admin', '/admin/:path*'],
};
