// Score API route handler
// Calculates risk score using Gemini with deterministic fallback
// Inserts visit and updates household risk

import { NextResponse } from 'next/server';
import { getSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { insertVisitWithRiskUpdate } from '@/lib/supabase/admin';
import { calculateScore } from '@/lib/scoring';
import { scoreRequestSchema, validateOrThrow } from '@/lib/validation';
import type { VisitResponses } from '@/lib/types';

interface HouseholdSelect {
  id: string;
  assigned_chw_id: string;
}

interface ProfileSelect {
  role: 'chw' | 'supervisor';
}

export async function POST(request: Request) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [{ path: '', message: 'Request body must be valid JSON' }],
        },
        { status: 422 }
      );
    }
    const { household_id, responses, notes, patient_name, patient_age, patient_gender } = validateOrThrow(scoreRequestSchema, body);

    // Verify CHW role before checking household details so non-CHWs cannot probe assignments.
    const supabase = await getSupabaseServerClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<ProfileSelect>();

    if (profileError || !profile || profile.role !== 'chw') {
      return NextResponse.json(
        { error: 'Only CHWs can submit visits' },
        { status: 403 }
      );
    }

    // Use admin client to check household existence and ownership
    // This bypasses RLS so CHWs still get actionable 404/403 responses.
    const admin = getSupabaseAdminClient();
    const { data: household, error: householdError } = await admin
      .from('households')
      .select('id, assigned_chw_id')
      .eq('id', household_id)
      .single<HouseholdSelect>();

    if (householdError || !household) {
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      );
    }

    if (household.assigned_chw_id !== user.id) {
      return NextResponse.json(
        { error: 'Household not assigned to you' },
        { status: 403 }
      );
    }

    // Calculate risk score - now passing age and responses for recommendation
    let scoreResult: Awaited<ReturnType<typeof calculateScore>>;
    try {
      scoreResult = await calculateScore(responses as VisitResponses, patient_age);
    } catch (scoreError) {
      console.error('Score calculation failed:', scoreError);
      return NextResponse.json(
        { error: 'Score calculation failed. Please try again.' },
        { status: 500 }
      );
    }

    // Insert visit and update household risk (admin client bypasses RLS for update)
    // Try full insert first; if it fails (e.g. recommendation columns missing),
    // retry with only core columns so the visit is never lost.
    let visit: { id: string };
    try {
      visit = await insertVisitWithRiskUpdate({
        household_id,
        chw_id: user.id,
        visit_date: new Date().toISOString().split('T')[0],
        responses: responses as Record<string, number>,
        total_score: scoreResult.score,
        risk_level: scoreResult.risk_level,
        explanation_en: scoreResult.explanation_en,
        explanation_ne: scoreResult.explanation_ne,
        action_en: scoreResult.action_en || '',
        action_ne: scoreResult.action_ne || '',
        recommendation_en: scoreResult.recommendation_en || '',
        recommendation_ne: scoreResult.recommendation_ne || '',
        specialist_type: scoreResult.specialist_type || null,
        patient_name: patient_name || null,
        patient_age: patient_age ?? null,
        patient_gender: patient_gender || null,
        notes: notes || null,
      });
    } catch (insertError) {
      console.error('Full visit insert failed, retrying with core fields:', insertError);
      // Retry with only the core columns that definitely exist in the base schema
      try {
        visit = await insertVisitWithRiskUpdate({
          household_id,
          chw_id: user.id,
          visit_date: new Date().toISOString().split('T')[0],
          responses: responses as Record<string, number>,
          total_score: scoreResult.score,
          risk_level: scoreResult.risk_level,
          explanation_en: scoreResult.explanation_en,
          explanation_ne: scoreResult.explanation_ne,
          action_en: '',
          action_ne: '',
          recommendation_en: '',
          recommendation_ne: '',
          specialist_type: null,
          patient_name: null,
          patient_age: null,
          patient_gender: null,
          notes: notes || null,
        } as Parameters<typeof insertVisitWithRiskUpdate>[0]);
      } catch (retryError) {
        console.error('Core visit insert also failed:', retryError);
        return NextResponse.json(
          { error: 'Failed to save visit. Please try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      visit_id: visit.id,
      score: scoreResult.score,
      risk_level: scoreResult.risk_level,
      explanation_en: scoreResult.explanation_en,
      explanation_ne: scoreResult.explanation_ne,
      scoring_method: scoreResult.scoring_method,
      action_en: scoreResult.action_en,
      action_ne: scoreResult.action_ne,
      recommendation_en: scoreResult.recommendation_en,
      recommendation_ne: scoreResult.recommendation_ne,
      specialist_type: scoreResult.specialist_type,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as unknown as { message: string; details: unknown };
      return NextResponse.json(
        { error: validationError.message, details: validationError.details },
        { status: 422 }
      );
    }

    console.error('Score API unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
