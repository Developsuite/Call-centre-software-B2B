-- Enable Realtime for sales table so that the UI updates without refreshing
alter publication supabase_realtime add table public.sales;
