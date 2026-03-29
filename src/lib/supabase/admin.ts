// Supabase admin client with service role
// Used for server-side operations that bypass RLS (seed scripts, risk updates)
// IMPORTANT: Only use in secure server contexts!

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

let adminClient: SupabaseClient | undefined;

export function getSupabaseAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role environment variables');
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

// Export convenience object
export const supabaseAdmin = {
  get client() {
    return getSupabaseAdminClient();
  },
};

// Helper to update household risk (bypasses RLS)
export async function updateHouseholdRisk(
  householdId: string,
  riskScore: number,
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
) {
  const admin = getSupabaseAdminClient();

  const { error } = await admin
    .from('households')
    .update({
      latest_risk_score: riskScore,
      latest_risk_level: riskLevel,
    })
    .eq('id', householdId);

  if (error) {
    throw new Error(`Failed to update household risk: ${error.message}`);
  }
}

// Visit type for insert
interface VisitInsert {
  household_id: string;
  chw_id: string;
  visit_date: string;
  patient_name: string | null;
  patient_age: number | null;
  patient_gender: 'Male' | 'Female' | 'Other' | null;
  responses: Record<string, number>;
  total_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  explanation_en: string;
  explanation_ne: string;
  action_en: string;
  action_ne: string;
  recommendation_en: string;
  recommendation_ne: string;
  specialist_type: 'psychiatrist' | 'child_psychiatrist' | 'addiction_psychiatrist' | null;
  notes?: string | null;
}

// Visit return type
interface VisitRow {
  id: string;
  household_id: string;
  chw_id: string;
  visit_date: string;
  patient_name: string | null;
  patient_age: number | null;
  patient_gender: 'Male' | 'Female' | 'Other' | null;
  responses: Record<string, number>;
  total_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  explanation_en: string;
  explanation_ne: string;
  action_en: string;
  action_ne: string;
  recommendation_en: string;
  recommendation_ne: string;
  specialist_type: 'psychiatrist' | 'child_psychiatrist' | 'addiction_psychiatrist' | null;
  notes: string | null;
  created_at: string;
}

// Helper to insert visit (uses admin for household update)
// Implements compensating transaction pattern to ensure atomicity
export async function insertVisitWithRiskUpdate(visitData: VisitInsert): Promise<VisitRow> {
  const admin = getSupabaseAdminClient();

  // Insert visit
  const { data: visit, error: visitError } = await admin
    .from('visits')
    .insert(visitData)
    .select()
    .single<VisitRow>();

  if (visitError) {
    throw new Error(`Failed to insert visit: ${visitError.message}`);
  }

  // Try to update household risk
  try {
    await updateHouseholdRisk(
      visitData.household_id,
      visitData.total_score,
      visitData.risk_level
    );
  } catch (riskUpdateError) {
    // Compensating transaction: delete the visit if household update fails
    // This ensures we don't leave orphaned visits without updated household risk
    console.error('Household risk update failed, rolling back visit:', riskUpdateError);

    const { error: deleteError } = await admin
      .from('visits')
      .delete()
      .eq('id', visit.id);

    if (deleteError) {
      console.error('Failed to rollback visit after household update failure:', deleteError);
      // Log but still throw the original error
    }

    // Throw the original error
    throw riskUpdateError;
  }

  return visit;
}
