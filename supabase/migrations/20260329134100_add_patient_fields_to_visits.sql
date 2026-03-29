ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS patient_name text;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS patient_age int;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS patient_gender text CHECK (patient_gender IS NULL OR patient_gender IN ('Male', 'Female', 'Other'));
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';
