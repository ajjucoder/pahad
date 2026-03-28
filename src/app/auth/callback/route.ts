// OAuth callback route handler
// Handles Google OAuth callback and redirects based on role

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRedirectPathForRole } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored in middleware
        }
      },
    },
  });

  // Exchange code for session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('OAuth exchange error:', exchangeError);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Get the user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // Look up profile to get role
  // IMPORTANT: Do NOT auto-create profiles for unknown Google accounts
  // This is per PRD section 7: "roles are seeded manually. No self-registration"
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // Profile doesn't exist - reject access
    console.error('No profile found for user:', user.id);
    return NextResponse.redirect(`${origin}/login?error=no_account`);
  }

  // Redirect based on role
  const redirectPath = getRedirectPathForRole(profile.role);
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
