import { NextResponse, type NextRequest } from 'next/server';
import { isValidDiaryAuth } from '@/lib/auth';

export function middleware(request: NextRequest) {
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

export const config = {
  matcher: ['/diar/:path*'],
};

