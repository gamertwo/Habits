import { NextResponse } from 'next/server';

export function middleware(request) {
  const userId = request.cookies.get('userId');
  const isAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup';
  const isGoogleCallback = request.nextUrl.pathname.startsWith('/api/auth/google');

  // Allow Google OAuth callback
  if (isGoogleCallback) {
    return NextResponse.next();
  }

  // Handle authentication flow
  if (!userId && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (userId && isAuthPage) {
    return NextResponse.redirect(new URL('/track', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/api/auth/google/callback'
  ],
};
