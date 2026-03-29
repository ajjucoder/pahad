-- Add applications table for CHW approval workflow
-- Tracks CHW applications pending supervisor approval

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  phone text,
  address text,
  area_id uuid REFERENCES areas(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  rejection_reason text
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_reviewed_by ON applications(reviewed_by);

-- Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Applicants can read their own application
CREATE POLICY "applications_select_own" ON applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Supervisors can read all applications
CREATE POLICY "applications_select_supervisor" ON applications
  FOR SELECT TO authenticated
  USING (public.is_supervisor());

-- Supervisors can update application status (approve/reject)
CREATE POLICY "applications_update_supervisor" ON applications
  FOR UPDATE TO authenticated
  USING (public.is_supervisor())
  WITH CHECK (public.is_supervisor());

-- Authenticated users can insert their own application
CREATE POLICY "applications_insert_own" ON applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to check if user has a pending or approved application
CREATE OR REPLACE FUNCTION public.has_application()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM applications
    WHERE user_id = auth.uid()
      AND status IN ('pending', 'approved')
  );
$$;
