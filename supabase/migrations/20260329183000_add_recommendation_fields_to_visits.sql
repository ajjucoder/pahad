ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS action_en text,
  ADD COLUMN IF NOT EXISTS action_ne text,
  ADD COLUMN IF NOT EXISTS recommendation_en text,
  ADD COLUMN IF NOT EXISTS recommendation_ne text,
  ADD COLUMN IF NOT EXISTS specialist_type text CHECK (
    specialist_type IS NULL OR specialist_type IN (
      'psychiatrist',
      'child_psychiatrist',
      'addiction_psychiatrist'
    )
  );

UPDATE public.visits
SET
  action_en = COALESCE(action_en, ''),
  action_ne = COALESCE(action_ne, ''),
  recommendation_en = COALESCE(recommendation_en, explanation_en),
  recommendation_ne = COALESCE(recommendation_ne, explanation_ne)
WHERE
  action_en IS NULL
  OR action_ne IS NULL
  OR recommendation_en IS NULL
  OR recommendation_ne IS NULL;

ALTER TABLE public.visits
  ALTER COLUMN action_en SET DEFAULT '',
  ALTER COLUMN action_ne SET DEFAULT '',
  ALTER COLUMN recommendation_en SET DEFAULT '',
  ALTER COLUMN recommendation_ne SET DEFAULT '';
