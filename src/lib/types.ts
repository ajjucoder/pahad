// Core domain types for Saveika

export type Role = 'chw' | 'supervisor';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type HouseholdStatus = 'active' | 'reviewed' | 'referred';

export type SpecialistType = 'psychiatrist' | 'child_psychiatrist' | 'addiction_psychiatrist';

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
  // Optional area name fields for display (populated by API joins)
  area_name?: string;
  area_name_ne?: string;
}

// Visit responses - all 12 screening signals
export interface VisitResponses {
  sleep: SignalValue;
  appetite: SignalValue;
  activities: SignalValue;
  hopelessness: SignalValue;
  withdrawal: SignalValue;
  trauma: SignalValue;
  fear_flashbacks: SignalValue;
  psychosis_signs: SignalValue;
  substance: SignalValue;
  substance_neglect: SignalValue;
  self_harm: SignalValue;
  wish_to_die: SignalValue;
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
  action_en: string;
  action_ne: string;
  recommendation_en?: string;
  recommendation_ne?: string;
  specialist_type?: SpecialistType;
  patient_name?: string | null;
  patient_age?: number | null;
  patient_gender?: string | null;
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
  action_en?: string;
  action_ne?: string;
  recommendation_en?: string;
  recommendation_ne?: string;
  specialist_type?: SpecialistType;
}

// API request types
export interface ScoreRequest {
  household_id: string;
  responses: VisitResponses;
  notes?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
}

export interface ScoreResponse {
  visit_id: string;
  score: number;
  risk_level: RiskLevel;
  explanation_en: string;
  explanation_ne: string;
  scoring_method: 'gemini' | 'fallback';
  action_en: string;
  action_ne: string;
  recommendation_en?: string;
  recommendation_ne?: string;
  specialist_type?: SpecialistType;
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
  action_en: string;
  action_ne: string;
  recommendation_en?: string;
  recommendation_ne?: string;
  specialist_type?: SpecialistType;
  patient_name?: string | null;
  patient_age?: number | null;
  patient_gender?: string | null;
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

// CHW Application status
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

// CHW Application type - for pending applications
export interface ChwApplication {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  requested_role: Role;
  phone: string | null;
  address: string | null;
  area_id: string | null;
  avatar_url: string | null;
  status: ApplicationStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Optional area name fields for display (populated by API joins)
  area_name?: string;
  area_name_ne?: string;
}

// CHW Application row type for database
export interface ChwApplicationRow {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  requested_role: Role;
  phone: string | null;
  address: string | null;
  area_id: string | null;
  avatar_url: string | null;
  status: ApplicationStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
