import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function run() {
  console.log('Checking RLS policies...');
  // We can use the REST API to call a function, but wait, maybe we can just query pg_policies using the postgres connection string if available, or just try to fetch a profile as the agent.
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const zaman = users.find(u => u.email === 'zaman@gmail.com');
  
  if (zaman) {
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: loginData } = await supabaseAnon.auth.signInWithPassword({
      email: 'zaman@gmail.com',
      password: '123456'
    });
    
    if (loginData?.user) {
      const { data: profile, error } = await supabaseAnon.from('profiles').select('*').eq('id', loginData.user.id).single();
      console.log('Agent profile fetch result:', profile ? 'SUCCESS' : 'FAILED');
      if (error) console.log('Error:', error.message);
    }
  }
}

run();
