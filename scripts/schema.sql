-- Saveika Database Schema
-- Run via Supabase SQL Editor

-- ============================================================
-- AREAS: Geographic areas/wards
-- ============================================================
CREATE TABLE IF NOT EXISTS areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ne text NOT NULL,
  center_lat double precision NOT NULL,
  center_lng double precision NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PROFILES: User profiles linked to auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  role text NOT NULL CHECK (role IN ('chw', 'supervisor')),
  area_id uuid REFERENCES areas(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- HOUSEHOLDS: Households being monitored
-- ============================================================
CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  head_name text NOT NULL,
  area_id uuid NOT NULL REFERENCES areas(id),
  assigned_chw_id uuid NOT NULL REFERENCES profiles(id),
  latest_risk_score int DEFAULT 0,
  latest_risk_level text DEFAULT 'low' CHECK (latest_risk_level IN ('low', 'moderate', 'high', 'critical')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'reviewed', 'referred')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- VISITS: Individual visit screening records
-- ============================================================
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id),
  chw_id uuid NOT NULL REFERENCES profiles(id),
  visit_date date DEFAULT CURRENT_DATE,
  responses jsonb NOT NULL,
  total_score int NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  explanation_en text NOT NULL,
  explanation_ne text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_households_assigned_chw ON households(assigned_chw_id);
CREATE INDEX IF NOT EXISTS idx_households_area ON households(area_id);
CREATE INDEX IF NOT EXISTS idx_households_risk_level ON households(latest_risk_level);
CREATE INDEX IF NOT EXISTS idx_visits_household ON visits(household_id);
CREATE INDEX IF NOT EXISTS idx_visits_chw ON visits(chw_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_area ON profiles(area_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY DEFINER HELPER FUNCTION
-- Avoids recursive RLS policy issues by checking supervisor role
-- without triggering RLS on profiles table
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'supervisor'
  );
$$;

-- ============================================================
-- AREAS: authenticated users can read (public reference data)
-- ============================================================
CREATE POLICY "areas_select_authenticated" ON areas
  FOR SELECT TO authenticated USING (true);
-- No insert/update/delete for areas via RLS (seed only via service role)

-- ============================================================
-- PROFILES: read own, supervisors read all, NO user updates to role
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_select_supervisor" ON profiles
  FOR SELECT TO authenticated
  USING (public.is_supervisor());

-- CRITICAL: No INSERT/UPDATE/DELETE policies for profiles.
-- profiles.role is immutable via client. Only service_role can write profiles.
-- This prevents role escalation attacks.

-- ============================================================
-- HOUSEHOLDS: CHW reads assigned, Supervisor reads all + updates status only
-- ============================================================
CREATE POLICY "households_select_chw" ON households
  FOR SELECT TO authenticated
  USING (assigned_chw_id = auth.uid());

CREATE POLICY "households_select_supervisor" ON households
  FOR SELECT TO authenticated
  USING (public.is_supervisor());

-- Supervisor can update ONLY status column (not reassign CHW, change risk, etc.)
-- DB-ENFORCED via trigger -- not just API-layer trust
CREATE POLICY "households_update_supervisor_status" ON households
  FOR UPDATE TO authenticated
  USING (public.is_supervisor())
  WITH CHECK (public.is_supervisor());

-- TRIGGER: reject any supervisor UPDATE that touches columns other than status
CREATE OR REPLACE FUNCTION enforce_supervisor_status_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service_role to update anything (for /api/score risk updates)
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- For authenticated users, only status may change
  IF NEW.code IS DISTINCT FROM OLD.code
    OR NEW.head_name IS DISTINCT FROM OLD.head_name
    OR NEW.area_id IS DISTINCT FROM OLD.area_id
    OR NEW.assigned_chw_id IS DISTINCT FROM OLD.assigned_chw_id
    OR NEW.latest_risk_score IS DISTINCT FROM OLD.latest_risk_score
    OR NEW.latest_risk_level IS DISTINCT FROM OLD.latest_risk_level
  THEN
    RAISE EXCEPTION 'Only status column may be updated';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS households_status_only_trigger ON households;
CREATE TRIGGER households_status_only_trigger
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION enforce_supervisor_status_only();

-- CHW can NOT update households at all via client
-- Risk score/level updates are handled server-side via service_role in /api/score

-- ============================================================
-- VISITS: CHW reads own + inserts for assigned households only, Supervisor reads all
-- ============================================================
CREATE POLICY "visits_select_chw" ON visits
  FOR SELECT TO authenticated
  USING (chw_id = auth.uid());

-- CRITICAL: Insert enforces BOTH chw_id ownership AND household assignment
CREATE POLICY "visits_insert_chw" ON visits
  FOR INSERT TO authenticated
  WITH CHECK (
    chw_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_id
      AND h.assigned_chw_id = auth.uid()
    )
  );

CREATE POLICY "visits_select_supervisor" ON visits
  FOR SELECT TO authenticated
  USING (public.is_supervisor());

-- No UPDATE or DELETE policies on visits for anyone (visits are immutable records)
