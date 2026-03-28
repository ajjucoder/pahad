// Core domain types for Pahad

export type Role = 'chw' | 'supervisor';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type HouseholdStatus = 'active' | 'reviewed' | 'referred';

// Response values for screening signals (0-3)
export type SignalValue = 0 | 1 | 2 | 3;

// Profile type
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: Role;
  area_id: string | null;
  created_at: string;
}

// Area type
export interface Area {
  id: string;
  name: string;
  name_ne: string;
  center_lat: number;
  center_lng: number;
  created_at: string;
}

// Household type
export interface Household {
  id: string;
  code: string;
  head_name: string;
  area_id: string;
  assigned_chw_id: string;
  latest_risk_score: number;
  latest_risk_level: RiskLevel;
  status: HouseholdStatus;
  created_at: string;
}

// Visit responses - all 8 signals
export interface VisitResponses {
  sleep: SignalValue;
  appetite: SignalValue;
  withdrawal: SignalValue;
  trauma: SignalValue;
  activities: SignalValue;
  hopelessness: SignalValue;
  substance: SignalValue;
  self_harm: SignalValue;
}

// Visit type
export interface Visit {
  id: string;
  household_id: string;
  chw_id: string;
  visit_date: string;
  responses: VisitResponses;
  total_score: number;
  risk_level: RiskLevel;
  explanation_en: string;
  explanation_ne: string;
  notes: string | null;
  created_at: string;
}

// LLM scoring result
export interface ScoringResult {
  score: number;
  risk_level: RiskLevel;
  explanation_en: string;
  explanation_ne: string;
  scoring_method: 'gemini' | 'fallback';
}

// API request types
export interface ScoreRequest {
  household_id: string;
  responses: VisitResponses;
  notes?: string;
}

export interface ScoreResponse {
  visit_id: string;
  score: number;
  risk_level: RiskLevel;
  explanation_en: string;
  explanation_ne: string;
  scoring_method: 'gemini' | 'fallback';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  profile?: Profile;
  error?: string;
}

// Database row types (for Supabase queries)
export interface HouseholdRow {
  id: string;
  code: string;
  head_name: string;
  area_id: string;
  assigned_chw_id: string;
  latest_risk_score: number;
  latest_risk_level: RiskLevel;
  status: HouseholdStatus;
  created_at: string;
}

export interface VisitRow {
  id: string;
  household_id: string;
  chw_id: string;
  visit_date: string;
  responses: VisitResponses;
  total_score: number;
  risk_level: RiskLevel;
  explanation_en: string;
  explanation_ne: string;
  notes: string | null;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: Role;
  area_id: string | null;
  created_at: string;
}

export interface AreaRow {
  id: string;
  name: string;
  name_ne: string;
  center_lat: number;
  center_lng: number;
  created_at: string;
}
