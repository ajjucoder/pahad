-- Add chw_applications table for pending CHW applications
-- CHW applicants sign in with Google, submit profile form, wait for supervisor approval

-- ============================================================
-- CHW APPLICATIONS: Pending CHW applications awaiting approval
-- ============================================================
CREATE TABLE IF NOT EXISTS chw_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  address text,
  area_id uuid REFERENCES areas(id),
  avatar_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_chw_applications_user ON chw_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_chw_applications_status ON chw_applications(status);
CREATE INDEX IF NOT EXISTS idx_chw_applications_area ON chw_applications(area_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE chw_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can read their own application
CREATE POLICY "chw_applications_select_own" ON chw_applications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Supervisors can read all applications
CREATE POLICY "chw_applications_select_supervisor" ON chw_applications
  FOR SELECT TO authenticated USING (public.is_supervisor());

-- Applicants can insert their own application (if none exists)
CREATE POLICY "chw_applications_insert_own" ON chw_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Applicants can update their own pending application
CREATE POLICY "chw_applications_update_own" ON chw_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Supervisors can update status (approve/reject)
CREATE POLICY "chw_applications_update_supervisor" ON chw_applications
  FOR UPDATE TO authenticated
  USING (public.is_supervisor())
  WITH CHECK (public.is_supervisor());

-- ============================================================
-- TRIGGER: Update updated_at timestamp on change
-- ============================================================
CREATE OR REPLACE FUNCTION update_chw_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chw_applications_updated_at_trigger ON chw_applications;
CREATE TRIGGER chw_applications_updated_at_trigger
  BEFORE UPDATE ON chw_applications
  FOR EACH ROW EXECUTE FUNCTION update_chw_applications_updated_at();

-- ============================================================
-- TRIGGER: Auto-create profile when application is approved
-- ============================================================
CREATE OR REPLACE FUNCTION create_profile_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO profiles (id, email, full_name, avatar_url, role, area_id)
    VALUES (
      NEW.user_id,
      NEW.email,
      NEW.full_name,
      NEW.avatar_url,
      'chw',
      NEW.area_id
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      area_id = EXCLUDED.area_id,
      role = 'chw';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS chw_applications_approval_trigger ON chw_applications;
CREATE TRIGGER chw_applications_approval_trigger
  AFTER UPDATE ON chw_applications
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_approval();
