import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { householdStatusRequestSchema, validateOrThrow } from '@/lib/validation';

export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();

    // Verify user is authenticated and is a supervisor
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a supervisor
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'supervisor') {
      return NextResponse.json(
        { error: 'Only supervisors can update household status' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { household_id, status } = validateOrThrow(householdStatusRequestSchema, body);

    // Update household status
    const { error: updateError } = await supabase
      .from('households')
      .update({ status })
      .eq('id', household_id);

    if (updateError) {
      console.error('Error updating household status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as unknown as { message: string; details: unknown };
      return NextResponse.json(
        { error: validationError.message, details: validationError.details },
        { status: 422 }
      );
    }

    console.error('Error in household status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
