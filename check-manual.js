const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkManual() {
  const { data, error } = await supabase
    .from('hr_attendance')
    .select('*')
    .gte('timestamp', '2026-08-01T00:00:00Z')
    .lte('timestamp', '2026-08-12T23:59:59Z')
    .eq('verify_mode', 99); // 99 means manual

  if (error) {
    console.error("Error fetching:", error);
    return;
  }
  
  console.log(`Manual records for Aug 1-12: ${data.length}`);
  if (data.length > 0) {
     console.log("Sample of manual records:");
     console.log(data.slice(0, 3));
  }
}

checkManual();
