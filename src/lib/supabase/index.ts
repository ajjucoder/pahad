// Supabase exports
export { getSupabaseBrowserClient, supabaseBrowser } from './client';
export {
  getSupabaseServerClient,
  getAuthenticatedUser,
  getUserProfile,
  supabaseServer,
} from './server';
export {
  getSupabaseAdminClient,
  supabaseAdmin,
  updateHouseholdRisk,
  insertVisitWithRiskUpdate,
} from './admin';
export type { Database, Profile, Area, Household, Visit } from './types';
