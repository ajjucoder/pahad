// Proxy for auth + role routing (Next.js 16 style)
// This replaces middleware.ts from Next.js 15 and earlier
// IMPORTANT: Do NOT trust cached role cookie without DB verification

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIES, ROLE_COOKIE_MAX_AGE } from './src/lib/constants';
import type { Role } from './src/lib/types';

// Paths that don't require authentication
const PUBLIC_PATHS = ['/', '/login'];

// Paths that require specific roles
const PROTECTED_PATHS: Record<string, Role> = {
  '/app': 'chw',
  '/supervisor': 'supervisor',
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith('/auth'))) {
    return NextResponse.next();
  }

  // Allow static files and API routes (API routes handle their own auth)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Check if this is a protected path
  const protectedEntry = Object.entries(PROTECTED_PATHS).find(([path]) =>
    pathname.startsWith(path)
  );

  if (!protectedEntry) {
    return NextResponse.next();
  }

  const [, requiredRole] = protectedEntry;

  // Create Supabase client to verify session
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('Missing Supabase environment variables');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session and get user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Not authenticated - redirect to login
  if (error || !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ALWAYS verify role from database - do NOT trust cached cookie alone
  // This prevents role escalation if someone somehow sets the cookie
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // Profile doesn't exist - redirect to login with error
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'no_account');
    return NextResponse.redirect(loginUrl);
  }

  const actualRole = profile.role as Role;

  // Update role cookie (refresh cache)
  supabaseResponse.cookies.set(COOKIES.ROLE, actualRole, {
    maxAge: ROLE_COOKIE_MAX_AGE,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  // Check if role matches required role for this path
  if (actualRole !== requiredRole) {
    // Redirect to correct home based on actual role
    const correctHome = actualRole === 'supervisor' ? '/supervisor' : '/app';
    return NextResponse.redirect(new URL(correctHome, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all paths except static files, but include _next/data routes for protection
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
