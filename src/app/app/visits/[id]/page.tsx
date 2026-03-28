import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { VisitDetailClient } from '@/components/chw/visit-detail-client';
import type { Visit, Household, Profile, Area } from '@/lib/types';

type VisitWithDetails = Visit & {
  households: Pick<Household, 'code' | 'head_name' | 'area_id'> & {
    areas: Pick<Area, 'name' | 'name_ne'> | null;
  };
  profiles: Pick<Profile, 'full_name'>;
};

interface VisitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function VisitDetailPage({ params }: VisitDetailPageProps) {
  // Next.js 16: params is async
  const { id } = await params;

  const supabase = await getSupabaseServerClient();

  // Fetch visit with household and CHW details
  const { data: visit, error } = await supabase
    .from('visits')
    .select(`
      *,
      households (
        code,
        head_name,
        area_id,
        areas (
          name,
          name_ne
        )
      ),
      profiles!visits_chw_id_fkey (
        full_name
      )
    `)
    .eq('id', id)
    .single<VisitWithDetails>();

  if (error || !visit) {
    notFound();
  }

  // Pass to client component for locale-aware rendering
  return <VisitDetailClient visit={visit} />;
}
