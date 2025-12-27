import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Site-wide password protection
const SITE_PASSWORD = process.env.SITE_PASSWORD;

export function middleware(request: NextRequest) {
  // Skip password protection if no password is set
  if (!SITE_PASSWORD) {
    return NextResponse.next();
  }

  // Skip for API routes, static files, and auth-related paths
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/site-login' ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.txt')
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('site-auth');
  if (authCookie?.value === SITE_PASSWORD) {
    return NextResponse.next();
  }

  // Redirect to login page
  const loginUrl = new URL('/site-login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
