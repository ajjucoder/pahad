// Auth helper functions for Saveika

import { getSupabaseServerClient } from './supabase/server';
import type { Role, Profile } from './types';

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

  if (profileError || !profile) {
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
