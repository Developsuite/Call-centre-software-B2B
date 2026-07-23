-- =========================================================================================
-- UPDATE V6: ADD HR EMPLOYEES DIRECTORY
-- =========================================================================================

CREATE TABLE IF NOT EXISTS public.hr_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL,
    team TEXT,
    base_salary NUMERIC DEFAULT 0,
    bonus NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "SuperAdmins can manage hr_employees" ON public.hr_employees
    FOR ALL USING (public.get_user_role() = 'SuperAdmin');

CREATE POLICY "Users can manage hr_employees in their org" ON public.hr_employees
    FOR ALL USING (organization_id = public.get_user_org_id());

-- Enable Realtime
alter publication supabase_realtime add table public.hr_employees;
