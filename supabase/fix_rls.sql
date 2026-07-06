-- Fix RLS: Add policy so users can always read their own profile row.
-- This avoids the circular dependency where get_user_role() needs to read 
-- profiles, but reading profiles requires get_user_role().

-- Allow any authenticated user to read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());
