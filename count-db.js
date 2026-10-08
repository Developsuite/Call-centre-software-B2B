const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function countDB() {
  const { count, error } = await supabase
    .from('hr_attendance')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error("Error fetching:", error);
    return;
  }
  
  console.log(`Total records in hr_attendance: ${count}`);
}

countDB();
