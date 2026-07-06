import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing login as Agent...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'hassan@gmail.com', // Agent email
    password: '123456'
  });

  if (error) {
    console.error('Login failed:', error);
    return;
  }

  console.log('Login successful for user:', data.user.id);
  
  // Try to fetch profile
  const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  
  if (profileErr) {
    console.error('Failed to fetch profile (Likely RLS issue):', profileErr);
  } else {
    console.log('Successfully fetched profile:', profile);
  }
}

run();
