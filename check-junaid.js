const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkJunaid() {
  const { data, error } = await supabase
    .from('hr_attendance')
    .select('*')
    .or("zk_user_id.eq.6,employee_id.eq.3b8106f1-a29b-41ca-9205-39aa981eccfc")
    .order('timestamp', { ascending: true });

  if (error) {
    console.error("Error fetching:", error);
    return;
  }
  console.log(`Junaid's total records: ${data.length}`);
  console.log(data.map(d => `${d.timestamp} (Status: ${d.status}, By: ${d.employee_id ? 'Manual/App' : 'Machine'}, Verify: ${d.verify_mode})`).join('\n'));
}

checkJunaid();
