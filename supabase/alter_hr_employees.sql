-- =========================================================================================
-- UPDATE V7: ALTER HR EMPLOYEES DIRECTORY (EXTENDED FIELDS)
-- =========================================================================================

ALTER TABLE public.hr_employees 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS cnic_number TEXT,
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS home_address TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS joining_date DATE,
ADD COLUMN IF NOT EXISTS employment_type TEXT,
ADD COLUMN IF NOT EXISTS commission_per_sale NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- NOTE: The existing 'bonus' column will be repurposed or deprecated in favor of 'commission_per_sale'
