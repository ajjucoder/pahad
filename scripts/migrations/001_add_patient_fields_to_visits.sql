-- Migration: Add patient demographic fields to visits table
-- Run this in Supabase SQL Editor if the visits table already exists

ALTER TABLE visits ADD COLUMN IF NOT EXISTS patient_name text;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS patient_age int;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS patient_gender text CHECK (patient_gender IS NULL OR patient_gender IN ('Male', 'Female', 'Other'));
ALTER TABLE visits ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';
