import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const DASHBOARD_PREFIX = '/dashboard';
const PROTECTED_API_PREFIXES = ['/api/admin', '/api/maintenance', '/api/upload'];

function requiresAuth(pathname: string) {
  if (pathname.startsWith(DASHBOARD_PREFIX)) return true;
  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!requiresAuth(pathname)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has('gc_session');
  if (hasSession) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const loginUrl = new URL('/', request.url);
  if (pathname !== '/') {
    loginUrl.searchParams.set('from', pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*', '/api/maintenance/:path*', '/api/upload'],
};
