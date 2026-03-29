// Core constants for Saveika

import type { RiskLevel } from './types';

// Risk level thresholds
export const RISK_THRESHOLDS: Record<RiskLevel, { min: number; max: number }> = {
  low: { min: 0, max: 25 },
  moderate: { min: 26, max: 50 },
  high: { min: 51, max: 75 },
  critical: { min: 76, max: 100 },
};

// Get risk level from score
export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'moderate';
  if (score <= 75) return 'high';
  return 'critical';
}

// Risk level colors (organic palette)
export const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; badge: string }> = {
  low: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  moderate: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  high: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800 border-red-200',
  },
};

// Flagged risk levels (for supervisor dashboard)
export const FLAGGED_RISK_LEVELS: RiskLevel[] = ['high', 'critical'];

// Household status colors
export const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  active: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  reviewed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  referred: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
};

// Cookie names
export const COOKIES = {
  ROLE: 'saveika-role',
} as const;

// Session duration (for role cookie cache)
export const ROLE_COOKIE_MAX_AGE = 60 * 5; // 5 minutes
