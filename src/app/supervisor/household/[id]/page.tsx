import { getSupabaseServerClient } from '@/lib/supabase/server';
import { normalizeRelation } from '@/lib/utils';
import { notFound } from 'next/navigation';
import type { RiskLevel, HouseholdStatus, Visit } from '@/lib/types';
import { HouseholdDetailClient } from './client-page';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  // Fetch household with related data
  const { data: household, error } = await supabase
    .from('households')
    .select(`
      id,
      code,
      head_name,
      latest_risk_score,
      latest_risk_level,
      status,
      area_id,
      assigned_chw_id,
      created_at,
      areas ( id, name, name_ne ),
      profiles!households_assigned_chw_id_fkey ( id, full_name, email )
    `)
    .eq('id', id)
    .single();

  if (error || !household) {
    notFound();
  }

  // Fetch all visits for this household
  const { data: visits } = await supabase
    .from('visits')
    .select(`
      id,
      household_id,
      chw_id,
      visit_date,
      patient_name,
      patient_age,
      patient_gender,
      responses,
      total_score,
      risk_level,
      explanation_en,
      explanation_ne,
      action_en,
      action_ne,
      recommendation_en,
      recommendation_ne,
      specialist_type,
      notes,
      created_at,
      profiles ( full_name )
    `)
    .eq('household_id', id)
    .order('visit_date', { ascending: false });

  // Serialize data for client component
  const area = normalizeRelation(
    household.areas as { id: string; name: string; name_ne: string } | { id: string; name: string; name_ne: string }[] | null
  );
  const chw = normalizeRelation(
    household.profiles as { id: string; full_name: string; email: string } | { id: string; full_name: string; email: string }[] | null
  );

  const householdData = {
    id: household.id,
    code: household.code,
    head_name: household.head_name,
    latest_risk_score: household.latest_risk_score,
    latest_risk_level: household.latest_risk_level as RiskLevel,
    status: household.status as HouseholdStatus,
    area: area || null,
    chw: chw || null,
    visits: (visits || []).map((v) => {
      const visitProfile = normalizeRelation(
        v.profiles as { full_name: string } | { full_name: string }[] | null
      );
      return {
        id: v.id,
        household_id: v.household_id,
        chw_id: v.chw_id,
        visit_date: v.visit_date,
        patient_name: v.patient_name,
        patient_age: v.patient_age,
        patient_gender: v.patient_gender as Visit['patient_gender'],
        responses: v.responses as Visit['responses'],
        total_score: v.total_score,
        risk_level: v.risk_level as RiskLevel,
        explanation_en: v.explanation_en,
        explanation_ne: v.explanation_ne,
        action_en: v.action_en,
        action_ne: v.action_ne,
        recommendation_en: v.recommendation_en,
        recommendation_ne: v.recommendation_ne,
        specialist_type: v.specialist_type as Visit['specialist_type'],
        notes: v.notes,
        created_at: v.created_at,
        chw_name: visitProfile?.full_name || 'Unknown',
      };
    }),
  };

  return <HouseholdDetailClient household={householdData} />;
}
