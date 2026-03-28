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
          responses: Record<string, number>;
          total_score: number;
          risk_level: 'low' | 'moderate' | 'high' | 'critical';
          explanation_en: string;
          explanation_ne: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          chw_id: string;
          visit_date?: string;
          responses: Record<string, number>;
          total_score: number;
          risk_level: 'low' | 'moderate' | 'high' | 'critical';
          explanation_en: string;
          explanation_ne: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          chw_id?: string;
          visit_date?: string;
          responses?: Record<string, number>;
          total_score?: number;
          risk_level?: 'low' | 'moderate' | 'high' | 'critical';
          explanation_en?: string;
          explanation_ne?: string;
          notes?: string | null;
          created_at?: string;
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
