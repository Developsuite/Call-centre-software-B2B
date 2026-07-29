-- =========================================================================================
-- CREATE HR LEAVES TABLE
-- =========================================================================================

CREATE TABLE IF NOT EXISTS public.hr_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('Casual', 'Sick', 'Unpaid')),
    reason TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent duplicate leave entries for same employee on same date
    UNIQUE(employee_id, leave_date)
);

-- Enable RLS
ALTER TABLE public.hr_leaves ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "SuperAdmins can manage hr_leaves" ON public.hr_leaves
    FOR ALL USING (public.get_user_role() = 'SuperAdmin');

CREATE POLICY "Users can manage hr_leaves in their org" ON public.hr_leaves
    FOR ALL USING (organization_id = public.get_user_org_id());

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hr_leaves;
