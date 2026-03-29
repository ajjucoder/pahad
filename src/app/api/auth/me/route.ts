import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getApplicationByUserId } from '@/lib/chw-applications';
import type { Profile, ChwApplication } from '@/lib/types';

export interface MeResponse {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Profile | null;
  application: ChwApplication | null;
}

export async function GET(): Promise<NextResponse<MeResponse>> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ user: null, profile: null, application: null }, { status: 401 });
  }

  // Try to get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile) {
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email!,
      },
      profile: profile as Profile,
      application: null,
    });
  }

  // No profile - check for application (admin client to bypass RLS)
  const admin = getSupabaseAdminClient();
  const { data: adminProfile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (adminProfile) {
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email!,
      },
      profile: adminProfile as Profile,
      application: null,
    });
  }

  // No profile - return application status for pending users
  const application = await getApplicationByUserId(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email!,
    },
    profile: null,
    application,
  });
}
