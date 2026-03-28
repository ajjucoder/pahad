// OAuth callback route handler
// Handles Google OAuth callback and redirects based on role

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ensureAdminProfile, getRedirectPathForRole, isAdminEmail } from '@/lib/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

function isLocalDevelopmentOrigin(origin: string) {
  return process.env.NODE_ENV !== 'production' &&
    (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'));
}

async function provisionDevelopmentProfile(user: {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}) {
  if (!user.email) {
    return null;
  }

  const admin = getSupabaseAdminClient();
  const fullName = user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email.split('@')[0];

  // Admin email gets supervisor role
  const role = isAdminEmail(user.email) ? 'supervisor' : 'chw';

  const { data: profile, error } = await admin
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role,
      area_id: null,
    })
    .select()
    .single();

  if (error || !profile) {
    console.error('Failed to provision development profile:', error);
    return null;
  }

  return profile;
}

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

    if (isAdminEmail(user.email)) {
      const adminProfile = await ensureAdminProfile(user);

      if (adminProfile) {
        const redirectPath = getRedirectPathForRole(adminProfile.role);
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    }

    if (isLocalDevelopmentOrigin(origin)) {
      const developmentProfile = await provisionDevelopmentProfile(user);

      if (developmentProfile) {
        const redirectPath = getRedirectPathForRole(developmentProfile.role);
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    }

    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=no_account`);
  }

  // Check if admin email needs role elevation
  // Admin email is treated as supervisor regardless of current role
  let effectiveRole = profile.role;
  if (isAdminEmail(user.email) && profile.role !== 'supervisor') {
    const elevatedProfile = await ensureAdminProfile(user, profile);
    if (!elevatedProfile) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=no_account`);
    }

    effectiveRole = elevatedProfile.role;
  }

  // Redirect based on role
  const redirectPath = getRedirectPathForRole(effectiveRole);
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
