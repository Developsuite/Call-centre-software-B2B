/**
 * ZKTeco Local Sync Bridge - Junaid ONLY (ID 6)
 */
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const DB_PATH = "C:\\Program Files (x86)\\ZKBio Time.Net\\TimeNet.db";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncJunaid() {
  try {
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('id').limit(1);
    if (orgError || !orgs || orgs.length === 0) throw new Error("Could not find an Organization.");
    const ORGANIZATION_ID = orgs[0].id;
    
    console.log(`[Sync] Reading local ZKBio Time database for Junaid ONLY...`);
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error("ERROR: Could not open db.", err.message);
        process.exit(1);
      }
    });

    db.all("SELECT employee_id, punch_time FROM att_punches WHERE employee_id = 6", [], async (err, rows) => {
      if (err) return;
      
      console.log(`[Sync] Found ${rows.length} punches for Junaid! Uploading...`);
      if (rows.length > 0) {
        const recordsToInsert = rows.map(log => {
          const dateObj = new Date(log.punch_time.replace(' ', 'T'));
          return {
            organization_id: ORGANIZATION_ID,
            zk_user_id: String(log.employee_id),
            timestamp: dateObj.toISOString(),
            status: 0,
            verify_mode: 0 // 0 marks it as a machine punch
          };
        });

        const { error } = await supabase.from('hr_attendance').upsert(recordsToInsert, { 
          onConflict: 'organization_id,zk_user_id,timestamp',
          ignoreDuplicates: true
        });
        
        if (error) console.error("Error:", error);
        else console.log(`[Sync] SUCCESS! Junaid's attendance is safely restored.`);
      }
      db.close();
    });
  } catch (error) {
    console.error("[Sync] ERROR:", error.message || error);
  }
}
syncJunaid();
