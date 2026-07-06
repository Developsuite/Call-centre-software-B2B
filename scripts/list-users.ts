import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('Fetching users and profiles...\n');
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from('profiles').select('*');
  
  for (const user of users) {
    const profile = profiles?.find(p => p.id === user.id);
    console.log(`Email: ${user.email} | Role: ${profile?.role} | Name: ${profile?.full_name}`);
  }
}

run();
