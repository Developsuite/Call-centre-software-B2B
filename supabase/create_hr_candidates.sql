CREATE TABLE IF NOT EXISTS public.hr_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    full_name TEXT NOT NULL,
    role_applied TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New', -- 'New', 'Interviewing', 'Hired', 'Rejected'
    phone TEXT,
    email TEXT,
    english_level TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "SuperAdmins can manage hr_candidates" ON public.hr_candidates
    FOR ALL USING (public.get_user_role() = 'SuperAdmin');

CREATE POLICY "Users can manage hr_candidates in their org" ON public.hr_candidates
    FOR ALL USING (organization_id = public.get_user_org_id());

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hr_candidates;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
