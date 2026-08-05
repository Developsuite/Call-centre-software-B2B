-- =========================================================================================
-- ADD ENGLISH COMMUNICATION LEVEL TO HR CANDIDATES TABLE
-- =========================================================================================

ALTER TABLE public.hr_candidates 
ADD COLUMN IF NOT EXISTS english_level TEXT;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
