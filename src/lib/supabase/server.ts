// Supabase server client
// Used in server components, route handlers, and server functions
// IMPORTANT: In Next.js 16, cookies() is async!

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSupabaseServerClient() {
  const cookieStore = await cookies(); // MUST await in Next.js 16

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(url, anonKey, {
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
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

// Helper to get authenticated user
export async function getAuthenticatedUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// Helper to get user profile with role
export async function getUserProfile() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile as {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    role: 'chw' | 'supervisor';
    area_id: string | null;
    created_at: string;
  };
}

// Export convenience object
export const supabaseServer = {
  get client() {
    return getSupabaseServerClient();
  },
  get user() {
    return getAuthenticatedUser();
  },
  get profile() {
    return getUserProfile();
  },
};
