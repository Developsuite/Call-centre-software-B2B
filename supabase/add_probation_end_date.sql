-- =========================================================================================
-- UPDATE V8: ADD PROBATION END DATE
-- =========================================================================================

ALTER TABLE public.hr_employees 
ADD COLUMN IF NOT EXISTS probation_end_date DATE;
