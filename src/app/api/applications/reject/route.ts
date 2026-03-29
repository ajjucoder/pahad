// API route to reject a CHW application
// POST /api/applications/reject - Supervisor only

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rejectApplication } from '@/lib/chw-applications';
import { validateOrThrow, chwApplicationRejectionSchema } from '@/lib/validation';
import type { ChwApplication } from '@/lib/types';

interface RejectResponse {
  success: boolean;
  application?: ChwApplication;
  error?: string;
}

/**
 * POST /api/applications/reject
 * Reject a pending CHW application (supervisor only)
 */
export async function POST(request: Request): Promise<NextResponse<RejectResponse>> {
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
    const { application_id, rejection_reason } = validateOrThrow(chwApplicationRejectionSchema, body);

    const result = await rejectApplication(application_id, user.id, rejection_reason);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      application: result.application,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as unknown as { message: string };
      return NextResponse.json(
        { success: false, error: validationError.message },
        { status: 422 }
      );
    }

    console.error('Reject application error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
