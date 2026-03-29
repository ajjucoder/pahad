WITH extracted AS (
  SELECT
    id,
    regexp_match(
      notes,
      '^\[Patient: Name: (.*?), Age: (.*?), Gender: (.*?)\]'
    ) AS patient_match
  FROM public.visits
  WHERE notes ~ '^\[Patient: Name: .*?, Age: .*?, Gender: .*?\]'
)
UPDATE public.visits AS visits
SET
  patient_name = CASE
    WHEN extracted.patient_match[1] = 'N/A' THEN NULL
    ELSE extracted.patient_match[1]
  END,
  patient_age = CASE
    WHEN extracted.patient_match[2] ~ '^\d+$' THEN extracted.patient_match[2]::int
    ELSE NULL
  END,
  patient_gender = CASE
    WHEN extracted.patient_match[3] IN ('Male', 'Female', 'Other') THEN extracted.patient_match[3]
    ELSE NULL
  END,
  notes = NULLIF(
    regexp_replace(
      visits.notes,
      '^\[Patient: Name: .*?, Age: .*?, Gender: .*?\](\n\n)?',
      ''
    ),
    ''
  )
FROM extracted
WHERE visits.id = extracted.id;
