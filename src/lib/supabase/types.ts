// Database types for Supabase
// These types match the schema defined in scripts/schema.sql

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: 'chw' | 'supervisor';
          area_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          role: 'chw' | 'supervisor';
          area_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: 'chw' | 'supervisor';
          area_id?: string | null;
          created_at?: string;
        };
      };
      areas: {
        Row: {
          id: string;
          name: string;
          name_ne: string;
          center_lat: number;
          center_lng: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_ne: string;
          center_lat: number;
          center_lng: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_ne?: string;
          center_lat?: number;
          center_lng?: number;
          created_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          code: string;
          head_name: string;
          area_id: string;
          assigned_chw_id: string;
          latest_risk_score: number;
          latest_risk_level: 'low' | 'moderate' | 'high' | 'critical';
          status: 'active' | 'reviewed' | 'referred';
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          head_name: string;
          area_id: string;
          assigned_chw_id: string;
          latest_risk_score?: number;
          latest_risk_level?: 'low' | 'moderate' | 'high' | 'critical';
          status?: 'active' | 'reviewed' | 'referred';
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          head_name?: string;
          area_id?: string;
          assigned_chw_id?: string;
          latest_risk_score?: number;
          latest_risk_level?: 'low' | 'moderate' | 'high' | 'critical';
          status?: 'active' | 'reviewed' | 'referred';
          created_at?: string;
        };
      };
      visits: {
        Row: {
          id: string;
          household_id: string;
          chw_id: string;
          visit_date: string;
          patient_name: string | null;
          patient_age: number | null;
          patient_gender: 'Male' | 'Female' | 'Other' | null;
          responses: Record<string, number>;
          total_score: number;
          risk_level: 'low' | 'moderate' | 'high' | 'critical';
          explanation_en: string;
          explanation_ne: string;
          action_en: string;
          action_ne: string;
          recommendation_en: string;
          recommendation_ne: string;
          specialist_type: 'psychiatrist' | 'child_psychiatrist' | 'addiction_psychiatrist' | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          chw_id: string;
          visit_date?: string;
          patient_name?: string | null;
          patient_age?: number | null;
          patient_gender?: 'Male' | 'Female' | 'Other' | null;
          responses: Record<string, number>;
          total_score: number;
          risk_level: 'low' | 'moderate' | 'high' | 'critical';
          explanation_en: string;
          explanation_ne: string;
          action_en?: string;
          action_ne?: string;
          recommendation_en?: string;
          recommendation_ne?: string;
          specialist_type?: 'psychiatrist' | 'child_psychiatrist' | 'addiction_psychiatrist' | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          chw_id?: string;
          visit_date?: string;
          patient_name?: string | null;
          patient_age?: number | null;
          patient_gender?: 'Male' | 'Female' | 'Other' | null;
          responses?: Record<string, number>;
          total_score?: number;
          risk_level?: 'low' | 'moderate' | 'high' | 'critical';
          explanation_en?: string;
          explanation_ne?: string;
          action_en?: string;
          action_ne?: string;
          recommendation_en?: string;
          recommendation_ne?: string;
          specialist_type?: 'psychiatrist' | 'child_psychiatrist' | 'addiction_psychiatrist' | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      chw_applications: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string;
          requested_role: 'chw' | 'supervisor';
          phone: string | null;
          address: string | null;
          area_id: string | null;
          avatar_url: string | null;
          status: 'pending' | 'approved' | 'rejected';
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          full_name: string;
          requested_role?: 'chw' | 'supervisor';
          phone?: string | null;
          address?: string | null;
          area_id?: string | null;
          avatar_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string;
          requested_role?: 'chw' | 'supervisor';
          phone?: string | null;
          address?: string | null;
          area_id?: string | null;
          avatar_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience type exports
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Area = Database['public']['Tables']['areas']['Row'];
export type Household = Database['public']['Tables']['households']['Row'];
export type Visit = Database['public']['Tables']['visits']['Row'];
export type ChwApplication = Database['public']['Tables']['chw_applications']['Row'];
