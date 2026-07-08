-- Enable Realtime for support tickets so that the UI updates without refreshing
alter publication supabase_realtime add table public.support_tickets;
