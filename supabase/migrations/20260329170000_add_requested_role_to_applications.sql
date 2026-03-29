ALTER TABLE chw_applications
ADD COLUMN IF NOT EXISTS requested_role text NOT NULL DEFAULT 'chw'
CHECK (requested_role IN ('chw', 'supervisor'));

UPDATE chw_applications
SET requested_role = 'chw'
WHERE requested_role IS NULL;

CREATE OR REPLACE FUNCTION create_profile_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO profiles (id, email, full_name, avatar_url, role, area_id)
    VALUES (
      NEW.user_id,
      NEW.email,
      NEW.full_name,
      NEW.avatar_url,
      NEW.requested_role,
      NEW.area_id
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      area_id = EXCLUDED.area_id,
      role = EXCLUDED.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
