// API route to approve a CHW application
// POST /api/applications/approve - Supervisor only

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { approveApplication } from '@/lib/chw-applications';
import { validateOrThrow, chwApplicationApprovalSchema } from '@/lib/validation';
import type { Profile, ChwApplication } from '@/lib/types';

interface ApproveResponse {
  success: boolean;
  application?: ChwApplication;
  profile?: Profile;
  error?: string;
}

/**
 * POST /api/applications/approve
 * Approve a pending CHW application (supervisor only)
 */
export async function POST(request: Request): Promise<NextResponse<ApproveResponse>> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is a supervisor
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'supervisor') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Supervisor access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { application_id, approved_role } = validateOrThrow(chwApplicationApprovalSchema, body);

    const result = await approveApplication(application_id, user.id, approved_role);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      application: result.application,
      profile: result.profile,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as unknown as { message: string };
      return NextResponse.json(
        { success: false, error: validationError.message },
        { status: 422 }
      );
    }

    console.error('Approve application error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
