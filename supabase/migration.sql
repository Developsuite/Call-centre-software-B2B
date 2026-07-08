-- =========================================================================================
-- SUPERADMIN SETUP - MUST BE CREATED FIRST
-- =========================================================================================

-- Please run this SQL script in the Supabase SQL Editor.
-- It will create all tables, policies, triggers, and seed the initial SuperAdmin account.

-- Create extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================================
-- TABLES
-- =========================================================================================

-- 1. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Profiles (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SuperAdmin', 'Admin', 'Processor', 'Agent')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    team TEXT,
    is_team_lead BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Sales
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    processor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Sale Data
    customer TEXT NOT NULL,
    account_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Process', 'Need Info', 'Processed', 'Rejected', 'Connected')),
    notes TEXT,
    processor_notes TEXT,
    history_logs JSONB DEFAULT '[]'::jsonb,
    
    -- We can denormalize some fields for easier querying in the prototype
    agent_name TEXT,
    team_name TEXT,
    processor_name TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    organization_name TEXT,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================================
-- ENABLE REALTIME
-- =========================================================================================

-- Enable realtime for sales and notifications
alter publication supabase_realtime add table public.sales;
alter publication supabase_realtime add table public.notifications;


-- =========================================================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current user organization_id
CREATE OR REPLACE FUNCTION public.get_user_org_id() RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- --------------------------------------------------------
-- Organizations Policies
-- --------------------------------------------------------
-- SuperAdmins can see/edit all orgs. Others can only see their own.
CREATE POLICY "SuperAdmins can do everything on organizations" ON public.organizations
    FOR ALL USING (public.get_user_role() = 'SuperAdmin');

CREATE POLICY "Users can read their own organization" ON public.organizations
    FOR SELECT USING (id = public.get_user_org_id());

-- --------------------------------------------------------
-- Profiles Policies
-- --------------------------------------------------------
-- SuperAdmins can see/edit all profiles.
CREATE POLICY "SuperAdmins can do everything on profiles" ON public.profiles
    FOR ALL USING (public.get_user_role() = 'SuperAdmin');

-- Admins can create/edit profiles in their own organization.
CREATE POLICY "Admins can manage profiles in their org" ON public.profiles
    FOR ALL USING (
        public.get_user_role() = 'Admin' 
        AND organization_id = public.get_user_org_id()
    );

-- Everyone can read profiles in their own organization
CREATE POLICY "Users can read profiles in their org" ON public.profiles
    FOR SELECT USING (organization_id = public.get_user_org_id());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- Users can always read their own profile (required to resolve get_user_org_id)
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());

-- --------------------------------------------------------
-- Sales Policies
-- --------------------------------------------------------
CREATE POLICY "SuperAdmins can do everything on sales" ON public.sales
    FOR ALL USING (public.get_user_role() = 'SuperAdmin');

-- Users can CRUD sales in their own organization
CREATE POLICY "Users can manage sales in their org" ON public.sales
    FOR ALL USING (organization_id = public.get_user_org_id());

-- --------------------------------------------------------
-- Notifications Policies
-- --------------------------------------------------------
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can insert notifications for their org" ON public.notifications
    FOR INSERT WITH CHECK (
        public.get_user_role() = 'SuperAdmin' 
        OR 
        public.get_user_org_id() = (SELECT organization_id FROM public.profiles WHERE id = user_id)
    );

-- --------------------------------------------------------
-- Support Tickets Policies
-- --------------------------------------------------------
CREATE POLICY "SuperAdmins can do everything on support_tickets" ON public.support_tickets
    FOR ALL USING (public.get_user_role() = 'SuperAdmin');

CREATE POLICY "Users can manage their own support_tickets" ON public.support_tickets
    FOR ALL USING (user_id = auth.uid());



-- =========================================================================================
-- END OF MIGRATION
-- =========================================================================================

-- IMPORTANT MANUAL UPDATE FOR V2:
-- Run this if updating an existing database to add the version history log!
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS history_logs JSONB DEFAULT '[]'::jsonb;

-- IMPORTANT MANUAL UPDATE FOR V3:
-- Run this to add Support Tickets!
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    organization_name TEXT,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SuperAdmins can do everything on support_tickets" ON public.support_tickets FOR ALL USING (public.get_user_role() = 'SuperAdmin');
CREATE POLICY "Users can manage their own support_tickets" ON public.support_tickets FOR ALL USING (user_id = auth.uid());

-- Enable Realtime for support tickets
alter publication supabase_realtime add table public.support_tickets;
