// API route to get a single CHW application by ID
// GET /api/applications/[id] - Supervisor or own application only

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getApplicationById } from '@/lib/chw-applications';
import type { ChwApplication } from '@/lib/types';

interface ApplicationResponse {
  application: ChwApplication | null;
  error?: string;
}

/**
 * GET /api/applications/[id]
 * Get a single CHW application by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApplicationResponse>> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ application: null, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get the application
  const application = await getApplicationById(id);

  if (!application) {
    return NextResponse.json(
      { application: null, error: 'Application not found' },
      { status: 404 }
    );
  }

  // Check authorization: supervisor or own application
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isSupervisor = profile?.role === 'supervisor';
  const isOwnApplication = application.user_id === user.id;

  if (!isSupervisor && !isOwnApplication) {
    return NextResponse.json(
      { application: null, error: 'Forbidden' },
      { status: 403 }
    );
  }

  return NextResponse.json({ application });
}
