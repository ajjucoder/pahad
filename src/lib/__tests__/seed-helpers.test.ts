// Regression tests for seed.ts scoring consistency bugs
// These tests fail because the seed-helpers module doesn't exist yet,
// and when implemented, should produce consistent scoring data

import { describe, it, expect } from 'vitest';
import type { RiskLevel } from '../types';
import { RISK_THRESHOLDS, getRiskLevelFromScore } from '../constants';
import {
  generateScoreForRiskLevel,
  generateConsistentVisitData,
} from '../seed-helpers';

// ============================================================================
// BUG 2: Seed score buckets don't match src/lib/constants.ts thresholds
// ============================================================================
//
// PROBLEM: scripts/seed.ts uses hardcoded score ranges in generateHouseholds():
//   - low: Math.floor(Math.random() * 31) → 0-30
//   - moderate: 31 + Math.floor(Math.random() * 30) → 31-60
//   - high: 61 + Math.floor(Math.random() * 20) → 61-80
//   - critical: 81 + Math.floor(Math.random() * 20) → 81-100
//
// But src/lib/constants.ts defines:
//   - low: 0-25
//   - moderate: 26-50
//   - high: 51-75
//   - critical: 76-100
//
// The mismatch causes seeded data to have invalid score/risk pairs.
// ============================================================================

describe('Regression: seed score buckets must match constants.ts thresholds', () => {
  it('should generate low risk scores within 0-25 range', () => {
    // Run multiple times to ensure consistency
    for (let i = 0; i < 100; i++) {
      const score = generateScoreForRiskLevel('low');
      expect(score).toBeGreaterThanOrEqual(RISK_THRESHOLDS.low.min);
      expect(score).toBeLessThanOrEqual(RISK_THRESHOLDS.low.max);
      expect(getRiskLevelFromScore(score)).toBe('low');
    }
  });

  it('should generate moderate risk scores within 26-50 range', () => {
    for (let i = 0; i < 100; i++) {
      const score = generateScoreForRiskLevel('moderate');
      expect(score).toBeGreaterThanOrEqual(RISK_THRESHOLDS.moderate.min);
      expect(score).toBeLessThanOrEqual(RISK_THRESHOLDS.moderate.max);
      expect(getRiskLevelFromScore(score)).toBe('moderate');
    }
  });

  it('should generate high risk scores within 51-75 range', () => {
    for (let i = 0; i < 100; i++) {
      const score = generateScoreForRiskLevel('high');
      expect(score).toBeGreaterThanOrEqual(RISK_THRESHOLDS.high.min);
      expect(score).toBeLessThanOrEqual(RISK_THRESHOLDS.high.max);
      expect(getRiskLevelFromScore(score)).toBe('high');
    }
  });

  it('should generate critical risk scores within 76-100 range', () => {
    for (let i = 0; i < 100; i++) {
      const score = generateScoreForRiskLevel('critical');
      expect(score).toBeGreaterThanOrEqual(RISK_THRESHOLDS.critical.min);
      expect(score).toBeLessThanOrEqual(RISK_THRESHOLDS.critical.max);
      expect(getRiskLevelFromScore(score)).toBe('critical');
    }
  });
});

// ============================================================================
// BUG 3: Seed stores visit total_score/risk_level copied from household
// ============================================================================
//
// PROBLEM: scripts/seed.ts creates visits with:
//   total_score: household.latest_risk_score,
//   risk_level: household.latest_risk_level,
//
// But the responses are generated via generateVisitResponses(riskLevel),
// which may not produce responses that score to the same values.
// The visit's score should be computed from its actual responses.
//
// Example: A household has latest_risk_score=50 (moderate),
// but generateVisitResponses('moderate') might produce responses
// that actually score to 35 (still moderate, but different score).
// ============================================================================

describe('Regression: seed visit scores must be recomputed from responses', () => {
  it('should produce visit data with score matching responses', () => {
    // Generate visit data for each risk level
    const riskLevels: RiskLevel[] = ['low', 'moderate', 'high', 'critical'];

    for (const riskLevel of riskLevels) {
      // Run multiple times since generation involves randomness
      for (let i = 0; i < 20; i++) {
        const visitData = generateConsistentVisitData(riskLevel);

        // The score in visit data should match what scoring.ts would compute
        // from the generated responses
        expect(visitData.total_score).toBe(visitData.expected_score);

        // The risk level should match what applyOverrideRules would compute
        // (accounting for self_harm, wish_to_die, psychosis_signs overrides)
        expect(visitData.risk_level).toBe(visitData.expected_risk_level);
      }
    }
  });

  it('should generate low risk visit with score consistent with responses', () => {
    const visitData = generateConsistentVisitData('low');

    // Verify the responses would produce the claimed score
    expect(visitData.total_score).toBe(visitData.expected_score);
    expect(getRiskLevelFromScore(visitData.expected_score)).toBe('low');

    // Risk level should be derived from responses, not copied from target
    expect(visitData.risk_level).toBe(visitData.expected_risk_level);
  });

  it('should generate critical risk visit with score consistent with responses', () => {
    const visitData = generateConsistentVisitData('critical');

    // Critical visits may have low scores but critical risk due to overrides
    expect(visitData.risk_level).toBe(visitData.expected_risk_level);

    // Score should be computed from responses
    expect(visitData.total_score).toBe(visitData.expected_score);
  });

  it('should correctly handle override rules when generating visit data', () => {
    // Generate many visits and verify override rules are respected
    for (let i = 0; i < 50; i++) {
      const visitData = generateConsistentVisitData('critical');

      // If responses have self_harm or wish_to_die, risk must be critical
      if (visitData.responses.self_harm >= 1 || visitData.responses.wish_to_die >= 1) {
        expect(visitData.expected_risk_level).toBe('critical');
      }

      // If responses have severe psychosis_signs and low/moderate score, risk must be high
      if (visitData.responses.psychosis_signs === 3) {
        const computedRisk = getRiskLevelFromScore(visitData.expected_score);
        if (computedRisk === 'low' || computedRisk === 'moderate') {
          expect(visitData.expected_risk_level).toBe('high');
        }
      }
    }
  });
});

// ============================================================================
// BUG: Household latest_risk diverges from its visits
// ============================================================================
//
// PROBLEM: scripts/seed.ts creates households with pre-determined risk,
// then creates visits with independently computed risk from responses.
// The household.latest_risk_score/level should reflect the latest visit.
//
// The seed-helpers.ts generateConsistentVisitData() ensures visit data
// is internally consistent, but seed.ts doesn't use it properly.
//
// FIX: Add a helper that generates complete household+visit data where
// the household risk is derived from its latest visit.
// ============================================================================

import { calculateFallbackScore } from '../scoring';

describe('Regression: household risk must align with latest visit', () => {
  it('should prove household risk can diverge from visit risk in current seed.ts', () => {
    // Simulate what seed.ts does: generate household risk independently
    const targetRiskLevel: RiskLevel = 'critical';

    // PROBLEM: The visit's actual score/risk may differ from household's
    // Even though both target 'critical', the values can diverge
    // because generateScoreForRiskLevel uses randomness

    // PROBLEM: The visit's actual score/risk may differ from household's
    // Even though both target 'critical', the values can diverge
    // because generateScoreForRiskLevel uses randomness

    // This test documents that the values CAN diverge
    // (Not testing that they always diverge, but that they CAN)
    // Run multiple times to show the issue
    let divergedCount = 0;
    for (let i = 0; i < 100; i++) {
      const hhScore = generateScoreForRiskLevel(targetRiskLevel);
      const vd = generateConsistentVisitData(targetRiskLevel);
      if (hhScore !== vd.total_score) {
        divergedCount++;
      }
    }

    // We expect divergence in most cases due to independent random generation
    expect(divergedCount).toBeGreaterThan(50);
  });

  it('should generate household with risk matching its latest visit', () => {
    // This test defines the expected behavior after fix
    // When generating seeded data, the household's latest_risk_score
    // and latest_risk_level should match its latest visit's values

    const targetRiskLevel: RiskLevel = 'critical';

    // Generate visit data first (what the fix should do)
    const latestVisit = generateConsistentVisitData(targetRiskLevel);

    // Household should use the visit's computed values
    const householdRiskLevel = latestVisit.risk_level;

    // Verify consistency
    expect(latestVisit.total_score).toBe(latestVisit.expected_score);
    expect(householdRiskLevel).toBe(latestVisit.expected_risk_level);

    // The score should match what calculateFallbackScore produces
    const computedScore = calculateFallbackScore(latestVisit.responses);
    expect(computedScore).toBe(latestVisit.total_score);
  });
});
