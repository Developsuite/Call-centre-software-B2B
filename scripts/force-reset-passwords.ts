import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function run() {
  console.log('Resetting passwords for all users to 123456 to be absolutely sure...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  const { data: { users } } = await supabase.auth.admin.listUsers();
  
  for (const user of users) {
    if (user.email === 'zaman@gmail.com' || user.email === 'ma7535541@gmail.com') {
      const { error } = await supabase.auth.admin.updateUserById(user.id, { password: '123456' });
      if (error) {
        console.log(`Error resetting password for ${user.email}:`, error.message);
      } else {
        console.log(`Successfully reset password for ${user.email}`);
      }
    }
  }
}

run();
