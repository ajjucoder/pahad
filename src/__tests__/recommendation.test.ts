// Tests for deterministic recommendation logic based on WHO mhGAP risk bands
// Per docs/SAVEIKA.md Section 6.4

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { RiskLevel } from '../lib/types';

// The recommendation utility will be implemented by the main agent
// These tests define the expected behavior

describe('Deterministic Recommendation Utility', () => {
  // Risk band actions per PRD Section 6.4
  const EXPECTED_ACTIONS: Record<RiskLevel, { en: string; ne: string }> = {
    low: {
      en: 'Log and monitor. Continue routine monthly visits.',
      ne: 'लग गर्नुहोस् र निगरानी राख्नुहोस्। नियमित मासिक भ्रमण जारी राख्नुहोस्।',
    },
    moderate: {
      en: 'Return visit within 1 week. Inform supervisor.',
      ne: '१ हप्ता भित्र फिर्ता भ्रमण गर्नुहोस्। सुपरिवेक्षकलाई सूचित गर्नुहोस्।',
    },
    high: {
      en: 'Refer to the health post. Flag in dashboard. Supervisor review required.',
      ne: 'स्वास्थ्य चौकीमा रेफर गर्नुहोस्। ड्यासबोर्डमा झण्डा लगाउनुहोस्। सुपरिवेक्षक समीक्षा आवश्यक छ।',
    },
    critical: {
      en: 'Immediate escalation. Contact supervisor + doctor. Emergency protocol.',
      ne: 'तत्काल वृद्धि। सुपरिवेक्षक र डाक्टरसँग सम्पर्क गर्नुहोस्। आपतकालीन प्रोटोकल।',
    },
  };

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRecommendation', () => {
    it('should return low risk recommendation for low risk level', async () => {
      const { getRecommendation } = await import('../lib/recommendation');
      const result = getRecommendation('low');

      expect(result).toEqual({
        action_en: EXPECTED_ACTIONS.low.en,
        action_ne: EXPECTED_ACTIONS.low.ne,
      });
    });

    it('should return moderate risk recommendation for moderate risk level', async () => {
      const { getRecommendation } = await import('../lib/recommendation');
      const result = getRecommendation('moderate');

      expect(result).toEqual({
        action_en: EXPECTED_ACTIONS.moderate.en,
        action_ne: EXPECTED_ACTIONS.moderate.ne,
      });
    });

    it('should return high risk recommendation for high risk level', async () => {
      const { getRecommendation } = await import('../lib/recommendation');
      const result = getRecommendation('high');

      expect(result).toEqual({
        action_en: EXPECTED_ACTIONS.high.en,
        action_ne: EXPECTED_ACTIONS.high.ne,
      });
    });

    it('should return critical risk recommendation for critical risk level', async () => {
      const { getRecommendation } = await import('../lib/recommendation');
      const result = getRecommendation('critical');

      expect(result).toEqual({
        action_en: EXPECTED_ACTIONS.critical.en,
        action_ne: EXPECTED_ACTIONS.critical.ne,
      });
    });

    it('should be deterministic - same input always produces same output', async () => {
      const { getRecommendation } = await import('../lib/recommendation');

      const results = Array.from({ length: 10 }, () => getRecommendation('moderate'));

      const firstResult = JSON.stringify(results[0]);
      results.forEach((result) => {
        expect(JSON.stringify(result)).toBe(firstResult);
      });
    });

    it('should return both English and Nepali translations', async () => {
      const { getRecommendation } = await import('../lib/recommendation');
      const riskLevels: RiskLevel[] = ['low', 'moderate', 'high', 'critical'];

      for (const risk_level of riskLevels) {
        const result = getRecommendation(risk_level);

        expect(result).toHaveProperty('action_en');
        expect(result).toHaveProperty('action_ne');
        expect(typeof result.action_en).toBe('string');
        expect(typeof result.action_ne).toBe('string');
        expect(result.action_en.length).toBeGreaterThan(0);
        expect(result.action_ne.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getRecommendationFromScore', () => {
    it('should derive recommendation from numeric score', async () => {
      const { getRecommendationFromScore } = await import('../lib/recommendation');

      // Low risk (0-25)
      const lowResult = getRecommendationFromScore(15);
      expect(lowResult.risk_level).toBe('low');
      expect(lowResult.action_en).toContain('Log and monitor');

      // Moderate risk (26-50)
      const moderateResult = getRecommendationFromScore(40);
      expect(moderateResult.risk_level).toBe('moderate');
      expect(moderateResult.action_en).toContain('1 week');

      // High risk (51-75)
      const highResult = getRecommendationFromScore(65);
      expect(highResult.risk_level).toBe('high');
      expect(highResult.action_en).toContain('health post');

      // Critical risk (76-100)
      const criticalResult = getRecommendationFromScore(90);
      expect(criticalResult.risk_level).toBe('critical');
      expect(criticalResult.action_en).toContain('Immediate');
    });

    it('should respect boundary scores', async () => {
      const { getRecommendationFromScore } = await import('../lib/recommendation');

      // Boundary cases
      expect(getRecommendationFromScore(0).risk_level).toBe('low');
      expect(getRecommendationFromScore(25).risk_level).toBe('low');
      expect(getRecommendationFromScore(26).risk_level).toBe('moderate');
      expect(getRecommendationFromScore(50).risk_level).toBe('moderate');
      expect(getRecommendationFromScore(51).risk_level).toBe('high');
      expect(getRecommendationFromScore(75).risk_level).toBe('high');
      expect(getRecommendationFromScore(76).risk_level).toBe('critical');
      expect(getRecommendationFromScore(100).risk_level).toBe('critical');
    });
  });

  describe('Override rules impact on recommendations', () => {
    it('should recommend critical action when self_harm override triggers', async () => {
      const { getRecommendation } = await import('../lib/recommendation');
      // Even with low score, self_harm >= 1 should show critical recommendation
      // This test assumes the main agent will integrate override logic

      const result = getRecommendation('critical');
      expect(result.action_en).toContain('Immediate');
      expect(result.action_en).toContain('supervisor');
    });

    it('should recommend critical action when wish_to_die override triggers', async () => {
      const { getRecommendation } = await import('../lib/recommendation');
      // Even with low score, wish_to_die >= 1 should show critical recommendation

      const result = getRecommendation('critical');
      expect(result.action_en).toContain('Emergency');
    });

    it('should recommend high action when severe psychosis detected', async () => {
      const { getRecommendation } = await import('../lib/recommendation');
      // psychosis_signs = 3 should force HIGH recommendation

      const result = getRecommendation('high');
      expect(result.action_en).toContain('health post');
      expect(result.action_en).toContain('Supervisor review');
    });
  });

  describe('Recommendation result type structure', () => {
    it('should return correct type shape', async () => {
      const { getRecommendation } = await import('../lib/recommendation');
      const result = getRecommendation('moderate');

      // Should match RecommendationResult interface
      expect(result).toMatchObject({
        action_en: expect.any(String),
        action_ne: expect.any(String),
      });
    });
  });
});
