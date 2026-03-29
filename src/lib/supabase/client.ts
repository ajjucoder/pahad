// Supabase browser client singleton
// Used in client components for auth and data operations

import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

export function hasSupabaseBrowserEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  client = createBrowserClient(url, anonKey);
  return client;
}

export function getSupabaseBrowserClientIfConfigured() {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  return getSupabaseBrowserClient();
}

// Export as named for convenience
export const supabaseBrowser = {
  get client() {
    return getSupabaseBrowserClient();
  },
};
