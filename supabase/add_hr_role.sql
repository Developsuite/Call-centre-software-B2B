-- =========================================================================================
-- UPDATE V5: ADD HR ROLE
-- =========================================================================================

-- We need to update the check constraint on the role column in public.profiles.
-- PostgreSQL does not allow modifying an existing check constraint directly.
-- We must drop the old constraint and add a new one.

DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the constraint name for the role column in the profiles table
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND pg_get_constraintdef(oid) LIKE '%role%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add the new constraint with 'HR' included
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('SuperAdmin', 'Admin', 'HR', 'Processor', 'Agent'));
