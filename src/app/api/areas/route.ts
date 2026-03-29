// API route for fetching areas
// Used in application form and other components

import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdminClient();

    const { data: areas, error } = await admin
      .from('areas')
      .select('id, name, name_ne')
      .order('name');

    if (error) {
      console.error('Failed to fetch areas:', error);
      return NextResponse.json(
        { error: 'Failed to fetch areas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      areas: areas || [],
    });
  } catch (error) {
    console.error('Areas fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
