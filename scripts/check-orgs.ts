import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: orgs } = await supabase.from('organizations').select('*');
  console.log('Organizations:', orgs);
}

run();
