-- =========================================================================================
-- UPDATE: ADD TEAM_ID FK TO HR_EMPLOYEES
-- Links hr_employees to the existing teams table for team-based HR management.
-- =========================================================================================

-- 1. Add team_id column referencing teams table
ALTER TABLE public.hr_employees
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- 2. Migrate existing text `team` column data into the new `team_id`
UPDATE public.hr_employees e
SET team_id = t.id
FROM public.teams t
WHERE e.team = t.name
  AND e.organization_id = t.organization_id
  AND e.team_id IS NULL
  AND e.team IS NOT NULL
  AND e.team != '';
