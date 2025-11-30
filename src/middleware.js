import { NextResponse } from 'next/server';

export function middleware(request) {
  const userId = request.cookies.get('userId');
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup';

  const isGoogleCallback = pathname.startsWith('/api/auth/google');

  // Only these pages require auth
  const protectedPaths = ['/', '/weekly', '/progress', '/analytics'];
  const isProtectedPath = protectedPaths.includes(pathname);

  // Allow Google OAuth callback
  if (isGoogleCallback) {
    return NextResponse.next();
  }

  // If not logged in and trying to access a protected page → go to login
  if (!userId && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access auth pages → go to home
  if (userId && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Everything else is public
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',             // protected
    '/weekly',       // protected
    '/progress',     // protected
    '/analytics',    // protected
    '/login',        // auth page
    '/signup',       // auth page
    '/api/auth/google/callback', // OAuth callback
  ],
};
