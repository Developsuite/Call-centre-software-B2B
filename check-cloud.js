const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCloudDB() {
  const { data, error } = await supabase
    .from('hr_attendance')
    .select('*')
    .gte('timestamp', '2026-08-01T00:00:00Z')
    .lt('timestamp', '2026-09-01T00:00:00Z')
    .order('timestamp', { ascending: true });

  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  console.log(`Total August records in cloud DB: ${data.length}`);
  if (data.length > 0) {
    console.log("Sample records:");
    console.log(data.slice(0, 5));
    
    // Check Junaid (zk_user_id = '6')
    const junaidRecords = data.filter(r => r.zk_user_id === '6' || r.employee_id === '6');
    console.log(`Junaid's August records in cloud: ${junaidRecords.length}`);
    if (junaidRecords.length > 0) {
       console.log(junaidRecords.slice(0, 10));
    }
  }
}

checkCloudDB();
