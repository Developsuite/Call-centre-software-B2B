const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function reverseSync() {
  console.log("Reversing the sync script (deleting raw machine punches)...");
  
  // The sync script inserted records with verify_mode = 0.
  // Manual records from UI have verify_mode = 99.
  
  const { data, error } = await supabase
    .from('hr_attendance')
    .delete()
    .eq('verify_mode', 0)
    .select();

  if (error) {
    console.error("Error reversing:", error);
  } else {
    console.log(`Successfully deleted ${data.length} raw machine punches.`);
  }
}

reverseSync();
