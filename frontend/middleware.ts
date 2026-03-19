import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/generate', '/designs', '/plan', '/walkthrough'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('auth_token');
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('login', '1');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/generate', '/generate/:path*', '/designs', '/designs/:path*', '/plan', '/plan/:path*', '/walkthrough', '/walkthrough/:path*'],
};
