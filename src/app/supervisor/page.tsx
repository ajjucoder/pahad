import { getSupabaseServerClient } from '@/lib/supabase/server';
import { FLAGGED_RISK_LEVELS, getRiskLevelFromScore } from '@/lib/constants';
import type { RiskLevel } from '@/lib/types';
import { SummaryCards } from '@/components/supervisor/summary-cards';
import { FlaggedTable, type FlaggedHousehold } from '@/components/supervisor/flagged-table';
import { AreaMap, type AreaMapData } from '@/components/supervisor/area-map-client';
import { DashboardHeader } from '@/components/supervisor/dashboard-header';

export default async function SupervisorDashboard() {
  const supabase = await getSupabaseServerClient();

  // Get start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Fetch all data in parallel
  const [
    visitsResult,
    householdsResult,
    // chwsResult - not needed, we calculate unique CHWs separately
    areasResult,
    flaggedHouseholdsResult,
    areaHouseholdsResult,
  ] = await Promise.all([
    // Total screenings this month
    supabase
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString()),

    // All households for avg risk calculation
    supabase
      .from('households')
      .select('latest_risk_score, latest_risk_level'),

    // Active CHWs query removed - we calculate this separately

    // All areas with their data
    supabase
      .from('areas')
      .select('id, name, name_ne, center_lat, center_lng'),

    // Flagged households (high/critical risk) with related data
    supabase
      .from('households')
      .select(`
        id,
        code,
        latest_risk_score,
        latest_risk_level,
        status,
        area_id,
        assigned_chw_id,
        created_at,
        areas ( name, name_ne ),
        profiles!households_assigned_chw_id_fkey ( full_name )
      `)
      .in('latest_risk_level', FLAGGED_RISK_LEVELS)
      .order('latest_risk_score', { ascending: false }),

    // All households grouped by area for map
    supabase
      .from('households')
      .select('area_id, latest_risk_score, latest_risk_level'),
  ]);

  // Calculate metrics
  const totalScreenings = visitsResult.count || 0;

  // Get unique CHW count
  const { data: uniqueChwsData } = await supabase
    .from('visits')
    .select('chw_id')
    .gte('created_at', startOfMonth.toISOString());
  
  const activeChwIds = new Set(uniqueChwsData?.map((v) => v.chw_id) || []);
  const activeCHWs = activeChwIds.size;

  // Calculate flagged households count
  const flaggedHouseholds = householdsResult.data?.filter(
    (h) => FLAGGED_RISK_LEVELS.includes(h.latest_risk_level as RiskLevel)
  ).length || 0;

  // Calculate average risk
  const households = householdsResult.data || [];
  const avgAreaRisk = households.length > 0
    ? Math.round(
        households.reduce((sum, h) => sum + (h.latest_risk_score || 0), 0) / households.length
      )
    : 0;
  const avgRiskLevel = getRiskLevelFromScore(avgAreaRisk);

  // Format flagged households for table
  const flaggedData: FlaggedHousehold[] = [];
  
  if (flaggedHouseholdsResult.data) {
    // Get the most recent visit for each flagged household
    const flaggedIds = flaggedHouseholdsResult.data.map(h => h.id);
    const { data: latestVisits } = await supabase
      .from('visits')
      .select('household_id, visit_date, created_at')
      .in('household_id', flaggedIds)
      .order('visit_date', { ascending: false });

    const lastVisitMap = new Map<string, string>();
    latestVisits?.forEach((v) => {
      if (!lastVisitMap.has(v.household_id)) {
        lastVisitMap.set(v.household_id, v.visit_date);
      }
    });

    for (const household of flaggedHouseholdsResult.data) {
      const areaArray = household.areas as { name: string; name_ne: string }[] | null;
      const profileArray = household.profiles as { full_name: string }[] | null;
      const area = areaArray?.[0];
      const profile = profileArray?.[0];

      flaggedData.push({
        id: household.id,
        code: household.code,
        area_name: area?.name || 'Unknown',
        area_name_ne: area?.name_ne || area?.name || 'Unknown',
        risk_score: household.latest_risk_score,
        risk_level: household.latest_risk_level as RiskLevel,
        last_visit_date: lastVisitMap.get(household.id) || household.created_at,
        chw_name: profile?.full_name || 'Unknown',
        status: household.status as 'active' | 'reviewed' | 'referred',
      });
    }
  }

  // Calculate area-level risk for map
  const areaMapData: AreaMapData[] = [];
  
  if (areasResult.data && areaHouseholdsResult.data) {
    const areaHouseholds: Record<string, { scores: number[]; count: number }> = {};

    for (const h of areaHouseholdsResult.data) {
      if (!areaHouseholds[h.area_id]) {
        areaHouseholds[h.area_id] = { scores: [], count: 0 };
      }
      areaHouseholds[h.area_id].scores.push(h.latest_risk_score || 0);
      areaHouseholds[h.area_id].count++;
    }

    for (const area of areasResult.data) {
      const data = areaHouseholds[area.id];
      if (data && data.count > 0) {
        const avgScore = Math.round(
          data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        );
        areaMapData.push({
          id: area.id,
          name: area.name,
          name_ne: area.name_ne,
          center_lat: area.center_lat,
          center_lng: area.center_lng,
          household_count: data.count,
          avg_risk_score: avgScore,
          avg_risk_level: getRiskLevelFromScore(avgScore),
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />

      {/* Summary Cards */}
      <SummaryCards
        totalScreenings={totalScreenings}
        flaggedHouseholds={flaggedHouseholds}
        activeCHWs={activeCHWs}
        avgAreaRisk={avgAreaRisk}
        avgRiskLevel={avgRiskLevel}
      />

      {/* Flagged Households Table */}
      <FlaggedTable households={flaggedData} />

      {/* Area Map */}
      <AreaMap areas={areaMapData} />
    </div>
  );
}
