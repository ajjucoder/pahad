#!/usr/bin/env npx tsx
// Saveika Database Seed Script
// Run via: npx tsx scripts/seed.ts
// Requires SUPABASE_SERVICE_ROLE_KEY env variable

import { createClient } from '@supabase/supabase-js';
import { RISK_THRESHOLDS } from '../src/lib/constants';
import { getFallbackResult } from '../src/lib/scoring';
import { DEMO_AREAS, buildDemoHouseholds, filterMissingHouseholds, mergeDemoUserIds } from '../src/lib/seed-data';
import type { VisitResponses, RiskLevel } from '../src/lib/types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', url ? 'set' : 'MISSING');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'set' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Demo user definitions
const DEMO_USERS = [
  { email: 'chw1@demo.com', password: 'demo1234', full_name: 'Ram Bahadur', role: 'chw' as const, area_name: 'Ward 3, Sindhupalchok' },
  { email: 'chw2@demo.com', password: 'demo1234', full_name: 'Sita Kumari', role: 'chw' as const, area_name: 'Ward 5, Sindhupalchok' },
  { email: 'chw3@demo.com', password: 'demo1234', full_name: 'Hari Thapa', role: 'chw' as const, area_name: 'Ward 7, Kavrepalanchok' },
  { email: 'supervisor@demo.com', password: 'demo1234', full_name: 'Dr. Sharma', role: 'supervisor' as const, area_name: null },
];

// Generate a score within the correct threshold range for a risk level
function generateScoreForRiskLevel(riskLevel: RiskLevel): number {
  const threshold = RISK_THRESHOLDS[riskLevel];
  return Math.floor(Math.random() * (threshold.max - threshold.min + 1)) + threshold.min;
}

// Generate sample visit responses based on risk level
// Returns responses that produce a score in the correct threshold range
function generateVisitResponses(riskLevel: RiskLevel): VisitResponses {
  // Get target score from correct threshold
  const targetScore = generateScoreForRiskLevel(riskLevel);

  // Start with base responses
  const responses: VisitResponses = {
    sleep: 0, appetite: 0, activities: 0, hopelessness: 0,
    withdrawal: 0, trauma: 0, fear_flashbacks: 0, psychosis_signs: 0,
    substance: 0, substance_neglect: 0, self_harm: 0, wish_to_die: 0,
  };

  // Calculate target weighted sum from score
  // score = round(weightedSum / 123 * 100) => weightedSum ≈ score * 123 / 100
  const targetWeightedSum = Math.round((targetScore / 100) * 123);

  // Distribute weighted sum across signals
  const signalWeights: Record<keyof VisitResponses, number> = {
    sleep: 2, appetite: 2, activities: 3, hopelessness: 4,
    withdrawal: 3, trauma: 3, fear_flashbacks: 3, psychosis_signs: 4,
    substance: 3, substance_neglect: 3, self_harm: 5, wish_to_die: 6,
  };

  const sortedKeys = Object.keys(signalWeights).sort(
    (a, b) => signalWeights[a as keyof VisitResponses] - signalWeights[b as keyof VisitResponses]
  ) as Array<keyof VisitResponses>;

  let remainingSum = targetWeightedSum;

  for (const key of sortedKeys) {
    if (remainingSum <= 0) break;

    const weight = signalWeights[key];
    const value = Math.min(3, Math.floor(remainingSum / weight));
    responses[key] = value as 0 | 1 | 2 | 3;
    remainingSum -= value * weight;
  }

  // For critical risk, sometimes use override signals
  if (riskLevel === 'critical' && Math.random() < 0.3) {
    if (Math.random() < 0.5) {
      responses.self_harm = 1;
    } else {
      responses.wish_to_die = 1;
    }
  }

  // For high risk, sometimes use psychosis override
  if (riskLevel === 'high' && Math.random() < 0.2) {
    responses.psychosis_signs = 3;
  }

  return responses;
}

// Generate explanations based on risk level
function getExplanations(riskLevel: RiskLevel) {
  const explanations: Record<RiskLevel, { en: string; ne: string }> = {
    low: {
      en: 'No significant warning signs observed. Continue routine monitoring.',
      ne: 'कुनै महत्त्वपूर्ण चेतावनी संकेतहरू देखिएन। नियमित अनुगमन जारी राख्नुहोस्।',
    },
    moderate: {
      en: 'Some warning signs present. Consider follow-up visit within 2 weeks.',
      ne: 'केही चेतावनी संकेतहरू देखिए। २ हप्ताभित्र फलो-अप भ्रमण गर्ने विचार गर्नुहोस्।',
    },
    high: {
      en: 'Multiple significant warning signs observed. Urgent follow-up recommended.',
      ne: 'धेरै महत्त्वपूर्ण चेतावनी संकेतहरू देखिए। अत्यावश्यक फलो-अप सिफारिस गरिएको छ।',
    },
    critical: {
      en: 'Severe warning signs present. Immediate support and referral needed.',
      ne: 'गम्भीर चेतावनी संकेतहरू देखिए। तत्काल समर्थन र रेफरल आवश्यक छ।',
    },
  };

  return explanations[riskLevel];
}

async function seed() {
  console.log('🌱 Starting Saveika database seed...\n');

  // 1. Create areas
  console.log('📍 Ensuring areas...');
  const areaNames = DEMO_AREAS.map((area) => area.name);
  const { data: existingAreas, error: existingAreasError } = await supabase
    .from('areas')
    .select('id, name')
    .in('name', areaNames);

  if (existingAreasError) {
    console.error('Failed to load existing areas:', existingAreasError);
    process.exit(1);
  }

  const existingAreaNames = new Set((existingAreas ?? []).map((area) => area.name));
  const missingAreas = DEMO_AREAS.filter((area) => !existingAreaNames.has(area.name));

  let insertedAreas: Array<{ id: string; name: string }> = [];
  if (missingAreas.length > 0) {
    const { data, error } = await supabase
      .from('areas')
      .insert(missingAreas)
      .select('id, name');

    if (error) {
      console.error('Failed to create missing areas:', error);
      process.exit(1);
    }

    insertedAreas = data ?? [];
  }

  const areaMap = new Map(
    [...(existingAreas ?? []), ...insertedAreas].map((area) => [area.name, area.id])
  );
  console.log(`   Created ${insertedAreas.length} missing areas (${areaMap.size} total demo areas available)\n`);

  // 2. Create users via Supabase Auth Admin API
  console.log('👤 Ensuring demo users...');
  const demoEmails = DEMO_USERS.map((user) => user.email);
  const { data: existingProfiles, error: existingProfilesError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', demoEmails);

  if (existingProfilesError) {
    console.error('Failed to load existing demo profiles:', existingProfilesError);
    process.exit(1);
  }

  const existingProfileIds = Object.fromEntries(
    (existingProfiles ?? []).map((profile) => [profile.email, profile.id])
  );
  const authUserIds: Record<string, string> = {};

  for (const user of DEMO_USERS) {
    if (existingProfileIds[user.email]) {
      console.log(`   Profile ${user.email} already exists, reusing...`);
      continue;
    }

    // Check if user already exists
    const { data: existingUsers, error: listUsersError } = await supabase.auth.admin.listUsers();
    if (listUsersError) {
      console.warn(`   Could not query auth admin for ${user.email}: ${listUsersError.message}`);
      continue;
    }

    const existing = existingUsers.users.find(u => u.email === user.email);

    let authUserId: string;

    if (existing) {
      console.log(`   User ${user.email} already exists, skipping...`);
      authUserId = existing.id;
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        console.error(`   Failed to create user ${user.email}:`, authError);
        continue;
      }
      authUserId = authData.user.id;
      console.log(`   Created ${user.email} (${user.role})`);
    }

    authUserIds[user.email] = authUserId;

    // Create or update profile
    const areaId = user.area_name ? areaMap.get(user.area_name) : null;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authUserId,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        area_id: areaId,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`   Failed to create profile for ${user.email}:`, profileError);
    }
  }
  const userIds = mergeDemoUserIds(existingProfileIds, authUserIds);
  console.log('');

  // 3. Create households
  console.log('🏠 Ensuring households...');
  const demoHouseholds = buildDemoHouseholds(
    Object.fromEntries(areaMap.entries()),
    userIds
  );

  const { data: existingHouseholds, error: existingHouseholdsError } = await supabase
    .from('households')
    .select('id, code')
    .in('code', demoHouseholds.map((household) => household.code));

  if (existingHouseholdsError) {
    console.error('Failed to load existing households:', existingHouseholdsError);
    process.exit(1);
  }

  const missingHouseholds = filterMissingHouseholds(
    demoHouseholds,
    new Set((existingHouseholds ?? []).map((household) => household.code))
  );

  let insertedHouseholds: Array<{
    id: string;
    code: string;
    assigned_chw_id: string;
    latest_risk_level: RiskLevel;
  }> = [];

  if (missingHouseholds.length > 0) {
    const { data, error } = await supabase
      .from('households')
      .insert(missingHouseholds)
      .select('id, code, assigned_chw_id, latest_risk_level');

    if (error) {
      console.error('Failed to create missing households:', error);
      process.exit(1);
    }

    insertedHouseholds = (data ?? []) as typeof insertedHouseholds;
  }

  console.log(
    `   Created ${insertedHouseholds.length} missing households (${demoHouseholds.length} total demo households defined)\n`
  );

  // 4. Create sample visits for each household
  console.log('📋 Creating sample visits for new households...');
  interface VisitInsert {
    household_id: string;
    chw_id: string;
    visit_date: string;
    responses: VisitResponses;
    total_score: number;
    risk_level: RiskLevel;
    explanation_en: string;
    explanation_ne: string;
    notes: string | null;
  }
  const visits: VisitInsert[] = [];

  for (const household of insertedHouseholds) {
    // Create 1-2 visits per household
    const visitCount = Math.random() > 0.5 ? 2 : 1;
    const riskLevel = household.latest_risk_level as RiskLevel;

    for (let i = 0; i < visitCount; i++) {
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const visitDate = new Date();
      visitDate.setDate(visitDate.getDate() - daysAgo);

      // Generate responses and compute score from them
      const responses = generateVisitResponses(riskLevel);
      const scoringResult = getFallbackResult(responses);
      const explanations = getExplanations(scoringResult.risk_level);

      visits.push({
        household_id: household.id,
        chw_id: household.assigned_chw_id,
        visit_date: visitDate.toISOString().split('T')[0],
        responses,
        total_score: scoringResult.score,  // Computed from responses
        risk_level: scoringResult.risk_level,  // Computed from responses with overrides
        explanation_en: explanations.en,
        explanation_ne: explanations.ne,
        notes: Math.random() > 0.7 ? 'Follow-up recommended during next visit.' : null,
      });
    }
  }

  let insertedVisits: Array<{
    household_id: string;
    visit_date: string;
    total_score: number;
    risk_level: RiskLevel;
  }> = [];

  if (visits.length > 0) {
    const { data, error } = await supabase
      .from('visits')
      .insert(visits)
      .select('household_id, visit_date, total_score, risk_level');

    if (error) {
      console.error('Failed to create visits:', error);
      process.exit(1);
    }

    insertedVisits = (data ?? []) as typeof insertedVisits;
  }
  console.log(`   Created ${insertedVisits.length} sample visits\n`);

  // 5. Update household latest_risk to match latest visit for each household
  console.log('🔄 Syncing household risk with latest visits...');
  const householdLatestVisit = new Map<string, typeof insertedVisits[0]>();

  // Find the latest visit for each household
  for (const visit of insertedVisits) {
    const existing = householdLatestVisit.get(visit.household_id);
    if (!existing || visit.visit_date > existing.visit_date) {
      householdLatestVisit.set(visit.household_id, visit);
    }
  }

  // Update each household with its latest visit's risk values
  for (const [householdId, visit] of householdLatestVisit) {
    const { error: updateError } = await supabase
      .from('households')
      .update({
        latest_risk_score: visit.total_score,
        latest_risk_level: visit.risk_level,
      })
      .eq('id', householdId);

    if (updateError) {
      console.error(`   Failed to update household ${householdId}:`, updateError);
    }
  }
  console.log(`   Updated ${householdLatestVisit.size} households with latest visit risk\n`);

  // Summary
  console.log('✅ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Areas: ${areaMap.size}`);
  console.log(`   Users: ${Object.keys(userIds).length}`);
  console.log(`   Households added this run: ${insertedHouseholds.length}`);
  console.log(`   Visits: ${insertedVisits.length}`);
  console.log('\n👤 Demo accounts:');
  DEMO_USERS.forEach(u => {
    console.log(`   ${u.email} / ${u.password} (${u.role})`);
  });
}

seed().catch(console.error);
