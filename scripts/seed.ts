#!/usr/bin/env npx tsx
// Pahad Database Seed Script
// Run via: npx tsx scripts/seed.ts
// Requires SUPABASE_SERVICE_ROLE_KEY env variable

import { createClient } from '@supabase/supabase-js';

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

// Area definitions with real Nepal coordinates
const AREAS = [
  { name: 'Ward 3, Sindhupalchok', name_ne: 'वडा ३, सिन्धुपाल्चोक', center_lat: 27.75, center_lng: 85.85 },
  { name: 'Ward 5, Sindhupalchok', name_ne: 'वडा ५, सिन्धुपाल्चोक', center_lat: 27.78, center_lng: 85.88 },
  { name: 'Ward 7, Kavrepalanchok', name_ne: 'वडा ७, काभ्रेपलाञ्चोक', center_lat: 27.55, center_lng: 85.55 },
];

// Generate households with globally unique codes using sequential numbering
// Each CHW gets a contiguous range of codes to ensure uniqueness
function generateHouseholds(
  areaId: string,
  chwId: string,
  startIndex: number, // Starting index to ensure no overlap across CHWs
  count: number,
  riskDistribution: { low: number; moderate: number; high: number; critical: number }
) {
  const households = [];

  const riskLevels = [
    ...Array(riskDistribution.low).fill('low'),
    ...Array(riskDistribution.moderate).fill('moderate'),
    ...Array(riskDistribution.high).fill('high'),
    ...Array(riskDistribution.critical).fill('critical'),
  ];

  const names = [
    'Thapa', 'Gurung', 'Tamang', 'Sherpa', 'Rai', 'Limbu', 'Magar', 'Newar',
    'Khadka', 'Shrestha', 'Acharya', 'Poudel', 'Regmi', 'Aryal', 'Basnet'
  ];

  for (let i = 0; i < count; i++) {
    const riskLevel = riskLevels[i] || 'low';
    const riskScore = riskLevel === 'low' ? Math.floor(Math.random() * 31) :
                      riskLevel === 'moderate' ? 31 + Math.floor(Math.random() * 30) :
                      riskLevel === 'high' ? 61 + Math.floor(Math.random() * 20) :
                      81 + Math.floor(Math.random() * 20);

    // Use a globally unique code with CHW prefix and sequential number
    const codeNumber = startIndex + i + 1;
    households.push({
      code: `HH-${String(codeNumber).padStart(3, '0')}`,
      head_name: `${names[i % names.length]} Family`,
      area_id: areaId,
      assigned_chw_id: chwId,
      latest_risk_score: riskScore,
      latest_risk_level: riskLevel,
      status: riskLevel === 'critical' ? 'active' : riskLevel === 'high' ? 'active' : 'active',
    });
  }

  return households;
}

// Generate sample visit responses based on risk level
function generateVisitResponses(riskLevel: string): Record<string, number> {
  const baseValues: Record<string, Record<string, number>> = {
    low: { sleep: 0, appetite: 0, withdrawal: 0, trauma: 0, activities: 0, hopelessness: 0, substance: 0, self_harm: 0 },
    moderate: { sleep: 1, appetite: 1, withdrawal: 1, trauma: 0, activities: 1, hopelessness: 1, substance: 0, self_harm: 0 },
    high: { sleep: 2, appetite: 2, withdrawal: 2, trauma: 1, activities: 2, hopelessness: 2, substance: 1, self_harm: 1 },
    critical: { sleep: 3, appetite: 3, withdrawal: 3, trauma: 2, activities: 3, hopelessness: 3, substance: 2, self_harm: 2 },
  };

  const responses: Record<string, number> = { ...(baseValues[riskLevel] || baseValues.low) };

  // Add some randomness
  const keys = Object.keys(responses);
  for (const key of keys) {
    responses[key] = Math.min(3, Math.max(0, responses[key] + (Math.random() > 0.5 ? 1 : 0)));
  }

  return responses;
}

// Generate explanations based on risk level
function getExplanations(riskLevel: string) {
  const explanations = {
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

  return explanations[riskLevel as keyof typeof explanations] || explanations.low;
}

async function seed() {
  console.log('🌱 Starting Pahad database seed...\n');

  // 1. Create areas
  console.log('📍 Creating areas...');
  const { data: areas, error: areasError } = await supabase
    .from('areas')
    .insert(AREAS)
    .select();

  if (areasError) {
    console.error('Failed to create areas:', areasError);
    process.exit(1);
  }
  console.log(`   Created ${areas.length} areas\n`);

  const areaMap = new Map(areas.map(a => [a.name, a.id]));

  // 2. Create users via Supabase Auth Admin API
  console.log('👤 Creating demo users...');
  const userIds: Record<string, string> = {};

  for (const user of DEMO_USERS) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
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

    userIds[user.email] = authUserId;

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
  console.log('');

  // 3. Create households
  console.log('🏠 Creating households...');
  interface HouseholdInsert {
    code: string;
    head_name: string;
    area_id: string;
    assigned_chw_id: string;
    latest_risk_score: number;
    latest_risk_level: string;
    status: string;
  }
  const allHouseholds: HouseholdInsert[] = [];

  // CHW1 gets 5 households in Ward 3 (1 low, 2 moderate, 1 high, 1 critical)
  // Codes: HH-001 to HH-005
  const chw1Id = userIds['chw1@demo.com'];
  if (chw1Id) {
    const area1Id = areaMap.get('Ward 3, Sindhupalchok')!;
    allHouseholds.push(...generateHouseholds(area1Id, chw1Id, 0, 5, { low: 1, moderate: 2, high: 1, critical: 1 }));
  }

  // CHW2 gets 5 households in Ward 5 (3 low, 1 moderate, 1 high)
  // Codes: HH-006 to HH-010
  const chw2Id = userIds['chw2@demo.com'];
  if (chw2Id) {
    const area2Id = areaMap.get('Ward 5, Sindhupalchok')!;
    allHouseholds.push(...generateHouseholds(area2Id, chw2Id, 5, 5, { low: 3, moderate: 1, high: 1, critical: 0 }));
  }

  // CHW3 gets 5 households in Ward 7 (4 low, 1 moderate)
  // Codes: HH-011 to HH-015
  const chw3Id = userIds['chw3@demo.com'];
  if (chw3Id) {
    const area3Id = areaMap.get('Ward 7, Kavrepalanchok')!;
    allHouseholds.push(...generateHouseholds(area3Id, chw3Id, 10, 5, { low: 4, moderate: 1, high: 0, critical: 0 }));
  }

  const { data: households, error: householdsError } = await supabase
    .from('households')
    .insert(allHouseholds)
    .select();

  if (householdsError) {
    console.error('Failed to create households:', householdsError);
    process.exit(1);
  }
  console.log(`   Created ${households.length} households\n`);

  // 4. Create sample visits for each household
  console.log('📋 Creating sample visits...');
  interface VisitInsert {
    household_id: string;
    chw_id: string;
    visit_date: string;
    responses: Record<string, number>;
    total_score: number;
    risk_level: string;
    explanation_en: string;
    explanation_ne: string;
    notes: string | null;
  }
  const visits: VisitInsert[] = [];

  for (const household of households) {
    // Create 1-2 visits per household
    const visitCount = Math.random() > 0.5 ? 2 : 1;
    const riskLevel = household.latest_risk_level;
    const explanations = getExplanations(riskLevel);

    for (let i = 0; i < visitCount; i++) {
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const visitDate = new Date();
      visitDate.setDate(visitDate.getDate() - daysAgo);

      visits.push({
        household_id: household.id,
        chw_id: household.assigned_chw_id,
        visit_date: visitDate.toISOString().split('T')[0],
        responses: generateVisitResponses(riskLevel),
        total_score: household.latest_risk_score,
        risk_level: riskLevel,
        explanation_en: explanations.en,
        explanation_ne: explanations.ne,
        notes: Math.random() > 0.7 ? 'Follow-up recommended during next visit.' : null,
      });
    }
  }

  const { data: insertedVisits, error: visitsError } = await supabase
    .from('visits')
    .insert(visits)
    .select();

  if (visitsError) {
    console.error('Failed to create visits:', visitsError);
    process.exit(1);
  }
  console.log(`   Created ${insertedVisits.length} sample visits\n`);

  // Summary
  console.log('✅ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Areas: ${areas.length}`);
  console.log(`   Users: ${Object.keys(userIds).length}`);
  console.log(`   Households: ${households.length}`);
  console.log(`   Visits: ${insertedVisits.length}`);
  console.log('\n👤 Demo accounts:');
  DEMO_USERS.forEach(u => {
    console.log(`   ${u.email} / ${u.password} (${u.role})`);
  });
}

seed().catch(console.error);
