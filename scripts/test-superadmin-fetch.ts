import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function run() {
  console.log('Fetching profiles as SuperAdmin...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: loginData } = await supabase.auth.signInWithPassword({
    email: 'ma7535541@gmail.com',
    password: '123456'
  });
  
  if (loginData?.user) {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log(`Successfully fetched ${profiles?.length} profiles.`);
      console.log('Profiles returned by Supabase for SuperAdmin:');
      for (const p of profiles || []) {
        console.log(` - ${p.full_name} (${p.email || p.id}) - Role: ${p.role}`);
      }
    }
  } else {
    console.log('Failed to login as SuperAdmin');
  }
}

run();
