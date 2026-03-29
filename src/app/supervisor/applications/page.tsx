import { getSupabaseServerClient } from '@/lib/supabase/server';
import { normalizeRelation } from '@/lib/utils';
import { ApplicationsClient, type ApplicationData } from '@/components/supervisor/applications-client';
import { ApplicationsHeader } from '@/components/supervisor/applications-header';

export default async function ApplicationsPage() {
  const supabase = await getSupabaseServerClient();

  // Fetch pending applications with area info
  const { data: applications } = await supabase
    .from('chw_applications')
    .select(`
      id,
      user_id,
      email,
      full_name,
      requested_role,
      phone,
      address,
      area_id,
      avatar_url,
      status,
      rejection_reason,
      reviewed_by,
      reviewed_at,
      created_at,
      areas ( name, name_ne )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Transform the data to flatten area info
  const applicationsData: ApplicationData[] =
    applications?.map((app) => {
      const area = normalizeRelation(
        app.areas as { name: string; name_ne: string } | { name: string; name_ne: string }[] | null
      );

      return {
        id: app.id,
        user_id: app.user_id,
        email: app.email,
        full_name: app.full_name,
        requested_role: app.requested_role,
        phone: app.phone,
        address: app.address,
        area_id: app.area_id,
        avatar_url: app.avatar_url,
        status: app.status,
        rejection_reason: app.rejection_reason,
        reviewed_by: app.reviewed_by,
        reviewed_at: app.reviewed_at,
        created_at: app.created_at,
        area_name: area?.name || 'Unassigned',
        area_name_ne: area?.name_ne || area?.name || 'Unassigned',
      };
    }) || [];

  return (
    <div className="space-y-6">
      <ApplicationsHeader count={applicationsData.length} />
      <ApplicationsClient applications={applicationsData} />
    </div>
  );
}
