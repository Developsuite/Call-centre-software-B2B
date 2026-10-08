const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkEmp() {
  const { data, error } = await supabase
    .from('hr_employees')
    .select('id, full_name, zk_user_id')
    .ilike('full_name', '%junaid%');

  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  console.log(data);
}

checkEmp();
