// Supabase browser client singleton
// Used in client components for auth and data operations

import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

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

// Export as named for convenience
export const supabaseBrowser = {
  get client() {
    return getSupabaseBrowserClient();
  },
};
