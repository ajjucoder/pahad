// Deterministic recommendation utility based on WHO mhGAP risk bands
// Per docs/SAVEIKA.md Section 6.4

import type { RiskLevel, VisitResponses, SpecialistType } from './types';
import { getRiskLevelFromScore } from './constants';

// Risk band actions per PRD Section 6.4
const RECOMMENDATION_ACTIONS: Record<RiskLevel, { en: string; ne: string }> = {
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

export interface RecommendationResult {
  action_en: string;
  action_ne: string;
  recommendation_en?: string;
  recommendation_ne?: string;
  specialist_type?: SpecialistType;
}

export interface RecommendationWithRisk extends RecommendationResult {
  risk_level: RiskLevel;
}

/**
 * Get deterministic recommendation for a given risk level
 * This is purely deterministic - same input always produces same output
 */
export function getRecommendation(riskLevel: RiskLevel, age?: number, responses?: VisitResponses): RecommendationResult {
  const action = RECOMMENDATION_ACTIONS[riskLevel];
  
  let specialist_type: SpecialistType | undefined;
  let recommendation_en: string | undefined;
  let recommendation_ne: string | undefined;

  // Determine specialist suggestion if age and responses are provided
  // Logic based on age + signal clusters
  if (age !== undefined && responses) {
    const hasDepression = responses.hopelessness >= 2 || responses.activities >= 2;
    const hasAnxiety = responses.fear_flashbacks >= 2;
    const hasPsychosis = responses.psychosis_signs >= 2;
    const hasSubstance = responses.substance >= 2 || responses.substance_neglect >= 2;

    if (age < 18) {
      if (hasDepression || hasAnxiety || hasPsychosis) {
        specialist_type = 'child_psychiatrist';
        recommendation_en = 'A Child & Adolescent Psychiatrist is recommended due to the patient\'s age and observed signals.';
        recommendation_ne = 'बिरामीको उमेर र देखिएका संकेतहरूको कारण बाल तथा किशोर मनोचिकित्सक सिफारिस गरिन्छ।';
      }
    } else if (age >= 65) {
      if (hasDepression) {
        specialist_type = 'psychiatrist';
        recommendation_en = 'A Psychiatrist is recommended due to the patient\'s age and depression signals.';
        recommendation_ne = 'बिरामीको उमेर र डिप्रेसनका संकेतहरूको कारण मनोचिकित्सक सिफारिस गरिन्छ।';
      } else {
        specialist_type = 'psychiatrist';
        recommendation_en = 'A Psychiatrist is recommended based on the observed signals.';
        recommendation_ne = 'देखिएका संकेतहरूको आधारमा मनोचिकित्सक सिफारिस गरिन्छ।';
      }
    } else {
      if (hasSubstance) {
        specialist_type = 'addiction_psychiatrist';
        recommendation_en = 'A Psychiatrist and Addiction Specialist is recommended due to observed substance use signals.';
        recommendation_ne = 'देखिएका लागु पदार्थ सेवनका संकेतहरूको कारण मनोचिकित्सक र लत विशेषज्ञ सिफारिस गरिन्छ।';
      } else if (hasDepression || hasAnxiety || hasPsychosis) {
        specialist_type = 'psychiatrist';
        recommendation_en = 'A Psychiatrist is recommended based on the observed signals.';
        recommendation_ne = 'देखिएका संकेतहरूको आधारमा मनोचिकित्सक सिफारिस गरिन्छ।';
      }
    }
  }

  return {
    action_en: action.en,
    action_ne: action.ne,
    recommendation_en,
    recommendation_ne,
    specialist_type,
  };
}

/**
 * Get recommendation from a numeric score
 * Derives risk level from score and returns appropriate recommendation
 */
export function getRecommendationFromScore(score: number, age?: number, responses?: VisitResponses): RecommendationWithRisk {
  const risk_level = getRiskLevelFromScore(score);
  const recommendation = getRecommendation(risk_level, age, responses);

  return {
    ...recommendation,
    risk_level,
  };
}
