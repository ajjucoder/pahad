// OAuth callback route handler
// Handles Google OAuth callback and redirects based on role
// Supports CHW application workflow for unapproved users

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRedirectPathForRole } from '@/lib/auth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getApplicationByUserId, createApplication } from '@/lib/chw-applications';

function isLocalDevelopmentOrigin(origin: string) {
  return process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_DEV_GOOGLE_AUTO_PROVISION === 'true' &&
    (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'));
}

function isSchemaMissingError(error: { code?: string; message?: string } | null): boolean {
  // PGRST205: Could not find table in schema cache
  // PGRST116: Not found (could indicate missing table in some cases)
  return error?.code === 'PGRST205' ||
    (error?.message?.includes('Could not find the table') ?? false);
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

  const { data: profile, error } = await admin
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: 'chw',
      area_id: null,
    })
    .select()
    .single();

  if (error || !profile) {
    // Check if this is a schema missing error and provide helpful guidance
    if (isSchemaMissingError(error)) {
      console.error(
        '❌ Database schema not set up!\n' +
        '   Run scripts/schema.sql in Supabase SQL Editor to create tables,\n' +
        '   then run: npm run db:seed\n' +
        '   Error details:', error
      );
    } else {
      console.error('Failed to provision development profile:', error);
    }
    return null;
  }

  return profile;
}

/**
 * Handle new CHW applicant flow:
 * 1. Create a pending application record
 * 2. Redirect to create-account page for profile completion
 */
async function handleNewApplicant(
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      avatar_url?: string;
    };
  },
  origin: string
): Promise<NextResponse> {
  if (!user.email) {
    return NextResponse.redirect(`${origin}/login?error=no_email`);
  }

  const fullName = user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email.split('@')[0];

  // Create or update the application using the helper
  const application = await createApplication({
    userId: user.id,
    email: user.email,
    fullName,
    requestedRole: 'chw',
    avatarUrl: user.user_metadata?.avatar_url,
  });

  if (!application) {
    // If we can't create application, sign out and show error
    console.error('Failed to create application for user:', user.id);
    return NextResponse.redirect(`${origin}/login?error=application_failed`);
  }

  // Redirect to create-account page where they can complete their profile
  return NextResponse.redirect(`${origin}/create-account`);
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

  // Profile exists - user is approved, proceed to app
  if (!profileError && profile) {
    const redirectPath = getRedirectPathForRole(profile.role);
    return NextResponse.redirect(`${origin}${redirectPath}`);
  }

  // Profile doesn't exist - check for existing application
  const existingApplication = await getApplicationByUserId(user.id);

  if (existingApplication) {
    // Application exists - redirect based on status
    if (existingApplication.status === 'approved') {
      // Application approved but profile not created (edge case)
      // Profile should have been created by trigger, redirect to app
      const redirectPath = getRedirectPathForRole('chw');
      return NextResponse.redirect(`${origin}${redirectPath}`);
    } else if (existingApplication.status === 'rejected') {
      // Application was rejected
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=application_rejected`);
    } else {
      // Application is pending - redirect to create-account page
      return NextResponse.redirect(`${origin}/create-account`);
    }
  }

  // No profile, no application - handle based on environment
  if (isLocalDevelopmentOrigin(origin)) {
    const developmentProfile = await provisionDevelopmentProfile(user);

    if (developmentProfile) {
      const redirectPath = getRedirectPathForRole(developmentProfile.role);
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Production: Create a new application and redirect to create-account
  return handleNewApplicant(user, origin);
}
