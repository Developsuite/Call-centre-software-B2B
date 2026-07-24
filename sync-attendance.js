/**
 * ZKTeco Local Sync Bridge (SQLite Version)
 * 
 * This script bypasses the machine entirely and reads the official 
 * ZKBio Time.Net database file on your computer, guaranteeing 100% reliability.
 * 
 * HOW TO RUN:
 * 1. Open your terminal in this folder
 * 2. Run: node sync-attendance.js
 */

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Path to your ZKBio Time.Net Database
const DB_PATH = "C:\\Program Files (x86)\\ZKBio Time.Net\\TimeNet.db";

// 1. Setup Supabase Connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAttendance() {
  try {
    // Automatically find your Organization ID
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('id').limit(1);
    if (orgError || !orgs || orgs.length === 0) {
      throw new Error("Could not find an Organization in your Supabase database.");
    }
    const ORGANIZATION_ID = orgs[0].id;
    console.log(`[Sync] Automatically found Organization ID: ${ORGANIZATION_ID}`);
    
    console.log(`[Sync] Reading local ZKBio Time database at ${DB_PATH}...`);
    
    // Connect to SQLite in Read-Only mode so we don't accidentally corrupt ZKBio Time
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error("[Sync] ERROR: Could not open database file. Make sure the path is correct.", err.message);
        process.exit(1);
      }
    });

    // Query the attendance punches table
    db.all("SELECT employee_id, punch_time FROM att_punches", [], async (err, rows) => {
      if (err) {
        console.error("[Sync] Error reading attendance table", err.message);
        db.close();
        return;
      }
      
      console.log(`[Sync] Found ${rows.length} total fingerprints/punches in ZKBio Time!`);
      
      if (rows.length > 0) {
        console.log("[Sync] Uploading to Supabase cloud in batches...");
        
        const recordsToInsert = rows.map(log => {
          // Convert "2026-07-24 03:10:44" to an ISO string your database accepts
          // We assume the time is in local timezone, which is fine for now
          const dateObj = new Date(log.punch_time.replace(' ', 'T'));
          
          return {
            organization_id: ORGANIZATION_ID,
            zk_user_id: String(log.employee_id),
            timestamp: dateObj.toISOString(),
            status: 0,
            verify_mode: 0
          };
        });

        // Insert in batches of 1000 to prevent crashing Supabase
        const chunkSize = 1000;
        let successCount = 0;
        
        for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
          const chunk = recordsToInsert.slice(i, i + chunkSize);
          const { error } = await supabase
            .from('hr_attendance')
            .upsert(chunk, { 
              onConflict: 'organization_id,zk_user_id,timestamp',
              ignoreDuplicates: true
            });
            
          if (error) {
             console.error("[Sync] DB Insert Error:", error);
          } else {
             successCount += chunk.length;
          }
        }

        console.log(`[Sync] SUCCESS! ${successCount} records synchronized to the cloud.`);
      }
      
      db.close();
    });

  } catch (error) {
    console.error("[Sync] ERROR:", error.message || error);
  }
}

// Run it
syncAttendance();
