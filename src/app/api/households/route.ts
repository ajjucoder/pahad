// Households API route handler
// Returns households assigned to the authenticated CHW
// Allows CHWs to create new households
// Uses admin client to bypass RLS and avoid recursive policy issues

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeRelation } from '@/lib/utils';

interface ProfileSelect {
  role: 'chw' | 'supervisor';
  area_id: string | null;
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
  areas?: { name: string; name_ne: string } | { name: string; name_ne: string }[] | null;
}

interface CreateHouseholdRequest {
  code: string;
  head_name: string;
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

    // Fetch households assigned to this CHW with area names (admin client bypasses RLS)
    const { data: households, error: householdsError } = await admin
      .from('households')
      .select(`
        id,
        code,
        head_name,
        area_id,
        assigned_chw_id,
        latest_risk_score,
        latest_risk_level,
        status,
        created_at,
        areas:area_id (name, name_ne)
      `)
      .eq('assigned_chw_id', user.id)
      .order('code', { ascending: true });

    if (householdsError) {
      console.error('Error fetching households:', householdsError);
      return NextResponse.json({ error: 'Failed to load households' }, { status: 500 });
    }

    // Transform results to flatten area names
    const householdsWithArea = (households as HouseholdSelect[]).map((hh) => {
      const area = normalizeRelation(hh.areas);
      return {
        id: hh.id,
        code: hh.code,
        head_name: hh.head_name,
        area_id: hh.area_id,
        assigned_chw_id: hh.assigned_chw_id,
        latest_risk_score: hh.latest_risk_score,
        latest_risk_level: hh.latest_risk_level,
        status: hh.status,
        created_at: hh.created_at,
        area_name: area?.name ?? undefined,
        area_name_ne: area?.name_ne ?? undefined,
      };
    });

    return NextResponse.json({ households: householdsWithArea });
  } catch (error) {
    console.error('Households API error:', error);
    return NextResponse.json({ error: 'Failed to load households' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: CreateHouseholdRequest = await request.json();
    const { code, head_name } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Household code is required' }, { status: 400 });
    }

    if (!head_name || !head_name.trim()) {
      return NextResponse.json({ error: 'Head of household name is required' }, { status: 400 });
    }

    // Use admin client to check profile and create household
    const admin = getSupabaseAdminClient();
    
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role, area_id')
      .eq('id', user.id)
      .single<ProfileSelect>();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only CHWs can create households
    if (profile.role !== 'chw') {
      return NextResponse.json({ error: 'Only CHWs can create households' }, { status: 403 });
    }

    // Check if CHW has an assigned area
    if (!profile.area_id) {
      return NextResponse.json({ error: 'You must be assigned to an area to create households' }, { status: 400 });
    }

    // Check if household code already exists
    const { data: existingHousehold } = await admin
      .from('households')
      .select('id')
      .eq('code', code.trim())
      .single();

    if (existingHousehold) {
      return NextResponse.json({ error: 'A household with this code already exists' }, { status: 400 });
    }

    // Create the household
    const { data: newHousehold, error: createError } = await admin
      .from('households')
      .insert({
        code: code.trim(),
        head_name: head_name.trim(),
        area_id: profile.area_id,
        assigned_chw_id: user.id,
        latest_risk_score: 0,
        latest_risk_level: 'low',
        status: 'active',
      })
      .select(`
        id,
        code,
        head_name,
        area_id,
        assigned_chw_id,
        latest_risk_score,
        latest_risk_level,
        status,
        created_at,
        areas:area_id (name, name_ne)
      `)
      .single<HouseholdSelect>();

    if (createError || !newHousehold) {
      console.error('Error creating household:', createError);
      return NextResponse.json({ error: 'Failed to create household' }, { status: 500 });
    }

    // Transform result to flatten area names
    const area = normalizeRelation(newHousehold.areas);
    const householdWithArea = {
      id: newHousehold.id,
      code: newHousehold.code,
      head_name: newHousehold.head_name,
      area_id: newHousehold.area_id,
      assigned_chw_id: newHousehold.assigned_chw_id,
      latest_risk_score: newHousehold.latest_risk_score,
      latest_risk_level: newHousehold.latest_risk_level,
      status: newHousehold.status,
      created_at: newHousehold.created_at,
      area_name: area?.name ?? undefined,
      area_name_ne: area?.name_ne ?? undefined,
    };

    return NextResponse.json({ household: householdWithArea });
  } catch (error) {
    console.error('Household creation API error:', error);
    return NextResponse.json({ error: 'Failed to create household' }, { status: 500 });
  }
}
