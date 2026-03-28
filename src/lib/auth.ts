// Auth helper functions for Pahad

import { getSupabaseAdminClient } from './supabase/admin';
import { getSupabaseServerClient } from './supabase/server';
import type { Role, Profile } from './types';

const ADMIN_EMAILS = new Set(['aeeju15@gmail.com']);

interface AuthUserProfileSeed {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

/**
 * Check if the given email is the configured admin email
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  return !!email && ADMIN_EMAILS.has(email.trim().toLowerCase());
}

/**
 * Check if error indicates missing database schema/tables
 */
function isSchemaMissingError(error: { code?: string; message?: string } | null): boolean {
  // PGRST205: Could not find table in schema cache
  // PGRST116: Not found (could indicate missing table in some cases)
  return error?.code === 'PGRST205' ||
    (error?.message?.includes('Could not find the table') ?? false);
}

export async function ensureAdminProfile(
  user: AuthUserProfileSeed,
  existingProfile?: Profile | null
): Promise<Profile | null> {
  if (!user.email || !isAdminEmail(user.email)) {
    return existingProfile ?? null;
  }

  if (existingProfile?.role === 'supervisor') {
    return existingProfile;
  }

  const admin = getSupabaseAdminClient();

  if (existingProfile) {
    const { data: updatedProfile, error } = await admin
      .from('profiles')
      .update({ role: 'supervisor' })
      .eq('id', user.id)
      .select()
      .single();

    if (error || !updatedProfile) {
      // Check if this is a schema missing error and provide helpful guidance
      if (isSchemaMissingError(error)) {
        console.error(
          '❌ Database schema not set up!\n' +
          '   Run scripts/schema.sql in Supabase SQL Editor to create tables,\n' +
          '   then run: npm run db:seed\n' +
          '   Error details:', error
        );
      } else {
        console.error('Failed to elevate admin profile:', error);
      }
      return null;
    }

    return updatedProfile as Profile;
  }

  const fullName = user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email.split('@')[0];

  const { data: createdProfile, error } = await admin
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email.trim().toLowerCase(),
      full_name: fullName,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: 'supervisor',
      area_id: null,
    })
    .select()
    .single();

  if (error || !createdProfile) {
    // Check if this is a schema missing error and provide helpful guidance
    if (isSchemaMissingError(error)) {
      console.error(
        '❌ Database schema not set up!\n' +
        '   Run scripts/schema.sql in Supabase SQL Editor to create tables,\n' +
        '   then run: npm run db:seed\n' +
        '   Error details:', error
      );
    } else {
      console.error('Failed to provision admin profile:', error);
    }
    return null;
  }

  return createdProfile as Profile;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  profile?: Profile;
  error?: string;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (!data.user) {
    return {
      success: false,
      error: 'No user returned',
    };
  }

  // Fetch profile to get role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (isAdminEmail(data.user.email)) {
    const adminProfile = await ensureAdminProfile(data.user, (profile as Profile | null) ?? null);

    if (!adminProfile) {
      await supabase.auth.signOut();

      return {
        success: false,
        error: 'Profile not found. Contact your administrator.',
      };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
      profile: adminProfile,
    };
  }

  if (profileError || !profile) {
    // CRITICAL: Clear the session before returning error
    // Without this, a valid session exists but the user cannot proceed
    await supabase.auth.signOut();

    return {
      success: false,
      error: 'Profile not found. Contact your administrator.',
    };
  }

  return {
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email!,
    },
    profile: profile as Profile,
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

/**
 * Get the redirect path based on user role
 */
export function getRedirectPathForRole(role: Role): string {
  return role === 'supervisor' ? '/supervisor' : '/app';
}

/**
 * Check if a role matches the required role for a path
 */
export function isRoleAuthorizedForPath(role: Role, pathname: string): boolean {
  if (pathname.startsWith('/supervisor')) {
    return role === 'supervisor';
  }
  if (pathname.startsWith('/app')) {
    return role === 'chw';
  }
  return true; // Public routes
}
