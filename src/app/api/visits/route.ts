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
  responses: Record<string, number>;
  total_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  explanation_en: string;
  explanation_ne: string;
  notes: string | null;
  created_at: string;
  households: {
    code: string;
  };
}

interface VisitWithHouseholdRelation extends Omit<VisitWithHousehold, 'households'> {
  households: Array<{ code: string }> | { code: string } | null;
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
      .select(`
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
      `)
      .eq('chw_id', user.id)
      .order('created_at', { ascending: false });

    if (visitsError) {
      console.error('Error fetching visits:', visitsError);
      return NextResponse.json({ error: 'Failed to load visits' }, { status: 500 });
    }

    const normalizedVisits = ((visits as VisitWithHouseholdRelation[] | null) ?? []).map((visit) => ({
      ...visit,
      households: Array.isArray(visit.households)
        ? (visit.households[0] ?? { code: 'Unknown' })
        : (visit.households ?? { code: 'Unknown' }),
    }));

    return NextResponse.json({ visits: normalizedVisits });
  } catch (error) {
    console.error('Visits API error:', error);
    return NextResponse.json({ error: 'Failed to load visits' }, { status: 500 });
  }
}
