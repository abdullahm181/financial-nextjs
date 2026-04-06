import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authSession = request.cookies.get('auth_session');

  // 1. Redirect logic for root "/"
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Auth Protection Logic
  const isAuthPage = pathname === '/login';
  const isAuthApi = pathname === '/api/login';
  // Exclude static assets and nextjs internal files
  const isStatic = pathname.startsWith('/_next') || 
                   pathname.startsWith('/favicon.ico') || 
                   pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/);

  if (!authSession && !isAuthPage && !isAuthApi && !isStatic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. If logged in, prevent going to login page
  if (authSession && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) except auth login
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
