// Households API route handler
// Returns households assigned to the authenticated CHW
// Uses admin client to bypass RLS and avoid recursive policy issues

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

interface ProfileSelect {
  role: 'chw' | 'supervisor';
}

interface HouseholdSelect {
  id: string;
  code: string;
  head_name: string;
  area_id: string;
  assigned_chw_id: string;
  latest_risk_score: number;
  latest_risk_level: 'low' | 'moderate' | 'high' | 'critical';
  status: 'active' | 'reviewed' | 'referred';
  created_at: string;
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

    // Only CHWs can access households list
    if (profile.role !== 'chw') {
      return NextResponse.json({ error: 'Only CHWs can access households' }, { status: 403 });
    }

    // Fetch households assigned to this CHW (admin client bypasses RLS)
    const { data: households, error: householdsError } = await admin
      .from('households')
      .select('id, code, head_name, area_id, assigned_chw_id, latest_risk_score, latest_risk_level, status, created_at')
      .eq('assigned_chw_id', user.id)
      .order('code', { ascending: true });

    if (householdsError) {
      console.error('Error fetching households:', householdsError);
      return NextResponse.json({ error: 'Failed to load households' }, { status: 500 });
    }

    return NextResponse.json({ households: households as HouseholdSelect[] });
  } catch (error) {
    console.error('Households API error:', error);
    return NextResponse.json({ error: 'Failed to load households' }, { status: 500 });
  }
}
