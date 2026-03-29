// Scoring logic: Gemini API with deterministic fallback

import { GoogleGenAI } from '@google/genai';
import type { VisitResponses, ScoringResult, RiskLevel } from './types';
import { getRiskLevelFromScore } from './constants';
import { SIGNAL_WEIGHTS, MAX_WEIGHTED_SUM } from './signals';
import { getRecommendation } from './recommendation';

// 10-second timeout for Gemini API calls (per PRD spec)
export const GEMINI_TIMEOUT_MS = 10000;

// Gemini prompt template
const GEMINI_PROMPT_TEMPLATE = `You are a community mental health screening assistant based on WHO mhGAP guidelines.

A community health worker visited a household and observed the following 12 signals. Each signal is rated: 0 = Not observed, 1 = Mild, 2 = Significant, 3 = Severe.

Signals:
- Sleep changes: {sleep}
- Appetite changes: {appetite}
- Stopped daily activities: {activities}
- Expressed hopelessness: {hopelessness}
- Social withdrawal: {withdrawal}
- Recent loss or trauma: {trauma}
- Visible fear, flashbacks, or extreme startle response: {fear_flashbacks}
- Talking to self, strange beliefs, or confused speech: {psychosis_signs}
- Alcohol/substance use increase: {substance}
- Neglecting family due to substance use: {substance_neglect}
- Self-harm indicators: {self_harm}
- Expressed wish to die or not exist: {wish_to_die}

The deterministic screening engine has already calculated:
- Score: {score}
- Risk level: {risk_level}

Based on these observations, provide:
1. A plain-language explanation in English (2-3 sentences, non-clinical, suitable for a community health worker)
2. The same explanation in Nepali

Respond ONLY in this exact JSON format:
{
  "explanation_en": "<string>",
  "explanation_ne": "<string>"
}`;

interface GeminiExplanationResponse {
  explanation_en: string;
  explanation_ne: string;
}

function applyOverrideRules(score: number, responses: VisitResponses): RiskLevel {
  if (responses.self_harm >= 1 || responses.wish_to_die >= 1) {
    return 'critical';
  }

  const computed = getRiskLevelFromScore(score);

  if (responses.psychosis_signs === 3 && (computed === 'low' || computed === 'moderate')) {
    return 'high';
  }

  return computed;
}

/**
 * Calculate deterministic fallback score using weighted sum
 * Formula: round(weightedSum / 123 * 100) across all 12 screening signals
 */
export function calculateFallbackScore(responses: VisitResponses): number {
  const weightedSum =
    responses.sleep * SIGNAL_WEIGHTS.sleep +
    responses.appetite * SIGNAL_WEIGHTS.appetite +
    responses.activities * SIGNAL_WEIGHTS.activities +
    responses.hopelessness * SIGNAL_WEIGHTS.hopelessness +
    responses.withdrawal * SIGNAL_WEIGHTS.withdrawal +
    responses.trauma * SIGNAL_WEIGHTS.trauma +
    responses.fear_flashbacks * SIGNAL_WEIGHTS.fear_flashbacks +
    responses.psychosis_signs * SIGNAL_WEIGHTS.psychosis_signs +
    responses.substance * SIGNAL_WEIGHTS.substance +
    responses.substance_neglect * SIGNAL_WEIGHTS.substance_neglect +
    responses.self_harm * SIGNAL_WEIGHTS.self_harm +
    responses.wish_to_die * SIGNAL_WEIGHTS.wish_to_die;

  const score = Math.round((weightedSum / MAX_WEIGHTED_SUM) * 100);
  return Math.min(100, Math.max(0, score)); // Clamp to 0-100
}

/**
 * Get fallback result when Gemini is unavailable
 */
export function getFallbackResult(responses: VisitResponses, age?: number): ScoringResult {
  const score = calculateFallbackScore(responses);
  const risk_level = applyOverrideRules(score, responses);
  const recommendation = getRecommendation(risk_level, age, responses);

  return {
    score,
    risk_level,
    explanation_en: 'Score calculated using standard screening weights. AI explanation unavailable.',
    explanation_ne: 'मानक स्क्रिनिङ भारका आधारमा स्कोर गणना गरिएको। AI व्याख्या उपलब्ध छैन।',
    scoring_method: 'fallback',
    action_en: recommendation.action_en,
    action_ne: recommendation.action_ne,
    recommendation_en: recommendation.recommendation_en,
    recommendation_ne: recommendation.recommendation_ne,
    specialist_type: recommendation.specialist_type,
  };
}

/**
 * Call Gemini API for scoring with 10-second timeout
 */
async function callGemini(
  responses: VisitResponses,
  score: number,
  riskLevel: RiskLevel
): Promise<GeminiExplanationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build prompt with actual values
  const prompt = GEMINI_PROMPT_TEMPLATE
    .replace('{sleep}', String(responses.sleep))
    .replace('{appetite}', String(responses.appetite))
    .replace('{activities}', String(responses.activities))
    .replace('{hopelessness}', String(responses.hopelessness))
    .replace('{withdrawal}', String(responses.withdrawal))
    .replace('{trauma}', String(responses.trauma))
    .replace('{fear_flashbacks}', String(responses.fear_flashbacks))
    .replace('{psychosis_signs}', String(responses.psychosis_signs))
    .replace('{substance}', String(responses.substance))
    .replace('{substance_neglect}', String(responses.substance_neglect))
    .replace('{self_harm}', String(responses.self_harm))
    .replace('{wish_to_die}', String(responses.wish_to_die))
    .replace('{score}', String(score))
    .replace('{risk_level}', riskLevel);

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Gemini API timeout after ${GEMINI_TIMEOUT_MS}ms`));
    }, GEMINI_TIMEOUT_MS);
  });

  try {
    // Race the Gemini call against the timeout
    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          temperature: 0,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      }),
      timeoutPromise,
    ]);

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(text) as GeminiExplanationResponse;

    // Validate response structure
    if (
      typeof parsed.explanation_en !== 'string' ||
      typeof parsed.explanation_ne !== 'string'
    ) {
      throw new Error('Invalid Gemini response structure');
    }

    return parsed;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

/**
 * Main scoring function: Try Gemini, fallback to deterministic on failure
 */
export async function calculateScore(responses: VisitResponses, age?: number): Promise<ScoringResult> {
  const score = calculateFallbackScore(responses);
  const risk_level = applyOverrideRules(score, responses);
  const recommendation = getRecommendation(risk_level, age, responses);

  try {
    const geminiResult = await callGemini(responses, score, risk_level);
    return {
      score,
      risk_level,
      explanation_en: geminiResult.explanation_en,
      explanation_ne: geminiResult.explanation_ne,
      scoring_method: 'gemini',
      action_en: recommendation.action_en,
      action_ne: recommendation.action_ne,
      recommendation_en: recommendation.recommendation_en,
      recommendation_ne: recommendation.recommendation_ne,
      specialist_type: recommendation.specialist_type,
    };
  } catch (error) {
    console.warn('Gemini explanation failed, using fallback:', error);
    return {
      score,
      risk_level,
      explanation_en: 'Score calculated using standard screening weights. AI explanation unavailable.',
      explanation_ne: 'मानक स्क्रिनिङ भारका आधारमा स्कोर गणना गरिएको। AI व्याख्या उपलब्ध छैन।',
      scoring_method: 'fallback',
      action_en: recommendation.action_en,
      action_ne: recommendation.action_ne,
      recommendation_en: recommendation.recommendation_en,
      recommendation_ne: recommendation.recommendation_ne,
      specialist_type: recommendation.specialist_type,
    };
  }
}

/**
 * Validate that a score matches its risk level
 *
 * When responses are provided, this validates that the risk level is correct
 * accounting for override rules (self_harm, wish_to_die, psychosis_signs).
 * Without responses, it only validates the score-based risk level.
 */
export function validateScoreConsistency(
  score: number,
  riskLevel: RiskLevel,
  responses?: VisitResponses
): boolean {
  if (responses) {
    // Use override-aware validation when responses are provided
    const expectedLevel = applyOverrideRules(score, responses);
    return expectedLevel === riskLevel;
  }
  // Backward compatible: only check score-based risk level
  const expectedLevel = getRiskLevelFromScore(score);
  return expectedLevel === riskLevel;
}
