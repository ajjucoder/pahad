// Visits API route handler
// Returns visits for the authenticated CHW with household info
// Uses admin client to bypass RLS and avoid recursive policy issues

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

interface ProfileSelect {
  role: 'chw' | 'supervisor';
}

interface VisitWithHousehold {
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
  households: {
    code: string;
  };
}

interface VisitWithHouseholdRelation extends Omit<VisitWithHousehold, 'households'> {
  households: Array<{ code: string }> | { code: string } | null;
}

const VISITS_BASE_SELECT = `
  id,
  household_id,
  chw_id,
  visit_date,
  responses,
  total_score,
  risk_level,
  explanation_en,
  explanation_ne,
  notes,
  created_at,
  households (
    code
  )
`;

const VISITS_EXTENDED_SELECT = `
  ${VISITS_BASE_SELECT},
  patient_name,
  patient_age,
  patient_gender,
  action_en,
  action_ne,
  recommendation_en,
  recommendation_ne,
  specialist_type
`;

function shouldRetryWithLegacyVisitQuery(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? '';

  return (
    message.includes('column') &&
    (message.includes('action_en') ||
      message.includes('action_ne') ||
      message.includes('recommendation_en') ||
      message.includes('recommendation_ne') ||
      message.includes('specialist_type') ||
      message.includes('patient_name') ||
      message.includes('patient_age') ||
      message.includes('patient_gender'))
  );
}

function normalizeVisits(visits: VisitWithHouseholdRelation[] | null) {
  return (visits ?? []).map((visit) => ({
    ...visit,
    households: Array.isArray(visit.households)
      ? (visit.households[0] ?? { code: 'Unknown' })
      : (visit.households ?? { code: 'Unknown' }),
  }));
}

export async function GET() {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to check profile role (bypasses RLS)
    const admin = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<ProfileSelect>();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only CHWs can access visits list
    if (profile.role !== 'chw') {
      return NextResponse.json({ error: 'Only CHWs can access visits' }, { status: 403 });
    }

    // Fetch visits for this CHW with household code (admin client bypasses RLS)
    const { data: visits, error: visitsError } = await admin
      .from('visits')
      .select(VISITS_EXTENDED_SELECT)
      .eq('chw_id', user.id)
      .order('created_at', { ascending: false });

    if (visitsError && !shouldRetryWithLegacyVisitQuery(visitsError)) {
      console.error('Error fetching visits:', visitsError);
      return NextResponse.json({ error: 'Failed to load visits' }, { status: 500 });
    }

    if (visitsError) {
      const { data: legacyVisits, error: legacyVisitsError } = await admin
        .from('visits')
        .select(VISITS_BASE_SELECT)
        .eq('chw_id', user.id)
        .order('created_at', { ascending: false });

      if (legacyVisitsError) {
        console.error('Error fetching visits:', legacyVisitsError);
        return NextResponse.json({ error: 'Failed to load visits' }, { status: 500 });
      }

      return NextResponse.json({ visits: normalizeVisits(legacyVisits as VisitWithHouseholdRelation[] | null) });
    }

    return NextResponse.json({ visits: normalizeVisits(visits as VisitWithHouseholdRelation[] | null) });
  } catch (error) {
    console.error('Visits API error:', error);
    return NextResponse.json({ error: 'Failed to load visits' }, { status: 500 });
  }
}
