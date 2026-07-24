-- =========================================================================================
-- CREATE HR ATTENDANCE TABLE
-- =========================================================================================

-- 1. Add zk_user_id to hr_employees so we can map device IDs to system users
ALTER TABLE public.hr_employees 
ADD COLUMN IF NOT EXISTS zk_user_id TEXT;

-- 2. Create the attendance table
CREATE TABLE IF NOT EXISTS public.hr_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL,
    employee_id UUID REFERENCES public.hr_employees(id) ON DELETE CASCADE,
    zk_user_id TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    status INTEGER, -- 0: Check-In, 1: Check-Out, etc.
    verify_mode INTEGER, -- Optional: 1: Fingerprint, 15: Face, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure we don't insert duplicate punches from the machine
    UNIQUE(organization_id, zk_user_id, timestamp)
);

-- Enable RLS
ALTER TABLE public.hr_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for organization isolation
CREATE POLICY "Users can view their organization's attendance"
    ON public.hr_attendance FOR SELECT
    USING (organization_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can insert their organization's attendance"
    ON public.hr_attendance FOR INSERT
    WITH CHECK (organization_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can update their organization's attendance"
    ON public.hr_attendance FOR UPDATE
    USING (organization_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can delete their organization's attendance"
    ON public.hr_attendance FOR DELETE
    USING (organization_id = current_setting('app.tenant_id', true));

-- For the service role / API to insert data directly
CREATE POLICY "Service Role Full Access to Attendance"
    ON public.hr_attendance FOR ALL
    USING (true)
    WITH CHECK (true);
