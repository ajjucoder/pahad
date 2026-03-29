// API route for CHW applications
// GET: List applications (supervisor only)
// POST: Create/update own application (authenticated user)

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getApplications, createApplication, updateApplication } from '@/lib/chw-applications';
import {
  validateOrThrow,
  chwApplicationCreateSchema,
  chwApplicationUpdateSchema,
} from '@/lib/validation';
import type { ChwApplication } from '@/lib/types';

interface ApplicationsListResponse {
  applications: ChwApplication[];
  total: number;
}

interface ApplicationResponse {
  success: boolean;
  application?: ChwApplication;
  error?: string;
  details?: unknown;
}

/**
 * GET /api/applications
 * List CHW applications - supervisors see all, others see only their own
 */
export async function GET(): Promise<NextResponse<ApplicationsListResponse | { error: string }>> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is supervisor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'supervisor') {
    // Supervisors see all applications
    const applications = await getApplications();
    return NextResponse.json({
      applications,
      total: applications.length,
    });
  }

  // Non-supervisors see only their own pending application
  const { data: application } = await supabase
    .from('chw_applications')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const applications = application ? [application as ChwApplication] : [];
  return NextResponse.json({
    applications,
    total: applications.length,
  });
}

/**
 * POST /api/applications
 * Create or update the current user's account application
 */
export async function POST(request: Request): Promise<NextResponse<ApplicationResponse>> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user already has a profile (approved)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profile) {
    return NextResponse.json(
      { success: false, error: 'User already has an approved profile' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { phone, address, area_id } = validateOrThrow(chwApplicationCreateSchema, body);

    // Get existing application
    const { data: existingApp } = await supabase
      .from('chw_applications')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const fullName = user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split('@')[0] ??
      'Unknown';

    if (existingApp) {
      // Update existing application if pending
      if (existingApp.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Application already processed' },
          { status: 400 }
        );
      }

      const updated = await updateApplication(user.id, {
        phone,
        address,
        areaId: area_id,
      });

      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Failed to update application' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, application: updated });
    }

    // Create new application
    const created = await createApplication({
      userId: user.id,
      email: user.email!,
      fullName,
      requestedRole: 'chw',
      phone,
      address,
      areaId: area_id,
    });

    if (!created) {
      return NextResponse.json(
        { success: false, error: 'Failed to create application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, application: created });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as unknown as { message: string; details: unknown };
      return NextResponse.json(
        { success: false, error: validationError.message, details: validationError.details },
        { status: 422 }
      );
    }

    console.error('Application error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/applications
 * Update the current user's pending application
 */
export async function PATCH(request: Request): Promise<NextResponse<ApplicationResponse>> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updates = validateOrThrow(chwApplicationUpdateSchema, body);

    const updated = await updateApplication(user.id, {
      full_name: updates.full_name,
      phone: updates.phone,
      address: updates.address,
      areaId: updates.area_id ?? undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update application. It may not exist or is not pending.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as unknown as { message: string; details: unknown };
      return NextResponse.json(
        { success: false, error: validationError.message, details: validationError.details },
        { status: 422 }
      );
    }

    console.error('Application update error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
