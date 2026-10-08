const sqlite3 = require('sqlite3').verbose();
const DB_PATH = "C:\\Program Files (x86)\\ZKBio Time.Net\\TimeNet.db";

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.all("SELECT * FROM att_punches WHERE employee_id = 6 AND punch_time LIKE '2026-08%' ORDER BY punch_time", [], (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Junaid's August Attendance Records:");
    rows.forEach(row => {
      console.log(`- ${row.punch_time}`);
    });
  });
});

setTimeout(() => db.close(), 2000);
