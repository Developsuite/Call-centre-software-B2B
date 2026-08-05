-- Update hr_candidates with new fields
ALTER TABLE public.hr_candidates 
ADD COLUMN IF NOT EXISTS salary_pitch TEXT,
ADD COLUMN IF NOT EXISTS commission_pitch TEXT;
