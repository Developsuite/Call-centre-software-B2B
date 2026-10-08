const sqlite3 = require('sqlite3').verbose();
const DB_PATH = "C:\\Program Files (x86)\\ZKBio Time.Net\\TimeNet.db";

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  // We need to find the table that has 'checkin' and 'checkout' columns.
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) throw err;
    
    let reportTableFound = false;

    tables.forEach(table => {
      db.all(`PRAGMA table_info(${table.name})`, [], (err, cols) => {
        if (err) return;
        const colNames = cols.map(c => c.name.toLowerCase());
        
        if (colNames.includes('checkin') && colNames.includes('checkout') && colNames.includes('workedminutes')) {
          console.log(`Found attendance sheet table: ${table.name}`);
          
          // Now get Junaid's records (employee_id = 6) for August
          db.all(`SELECT * FROM ${table.name} WHERE employee_id = 6 AND att_date LIKE '2026-08%' ORDER BY att_date`, [], (err, rows) => {
            if (err) {
               console.error(err);
               return;
            }
            console.log("\n--- Junaid's August Attendance Sheet ---");
            rows.forEach(r => {
                console.log(`Date: ${r.att_date.split(' ')[0]} | Check-In: ${r.checkin || 'Missed'} | Check-Out: ${r.checkout || 'Missed'} | Worked Mins: ${r.workedMinutes} | Timetable: ${r.timetable_id || 'None'}`);
            });
          });
        }
      });
    });
  });
});

setTimeout(() => db.close(), 3000);
