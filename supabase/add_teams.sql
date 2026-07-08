-- =========================================================================================
-- UPDATE V4: ADD TEAMS TABLE
-- =========================================================================================

-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add team_id to profiles and sales (We'll keep the text `team` for backward compatibility temporarily)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- 3. Migrate existing team names into the teams table automatically
DO $$
DECLARE
    org RECORD;
    new_team_id UUID;
BEGIN
    -- Loop through all unique organization and team combinations from profiles
    FOR org IN 
        SELECT DISTINCT organization_id, team FROM public.profiles WHERE team IS NOT NULL AND team != ''
    LOOP
        -- Insert the team and get the ID (assuming no duplicate names within the same org)
        INSERT INTO public.teams (name, organization_id) 
        VALUES (org.team, org.organization_id)
        RETURNING id INTO new_team_id;

        -- Update the profiles with the new team_id
        UPDATE public.profiles 
        SET team_id = new_team_id 
        WHERE organization_id = org.organization_id AND team = org.team;

        -- Update the sales with the new team_id
        UPDATE public.sales
        SET team_id = new_team_id
        WHERE organization_id = org.organization_id AND team_name = org.team;
    END LOOP;
END $$;

-- 4. Enable RLS on Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can do everything on teams" ON public.teams
    FOR ALL USING (public.get_user_role() = 'SuperAdmin');

CREATE POLICY "Users can manage teams in their org" ON public.teams
    FOR ALL USING (organization_id = public.get_user_org_id());

-- 5. Enable Realtime
alter publication supabase_realtime add table public.teams;
