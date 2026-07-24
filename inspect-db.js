const sqlite3 = require('sqlite3').verbose();

const DB_PATH = "C:\\Program Files (x86)\\ZKBio Time.Net\\TimeNet.db";

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  // 1. List all tables
  console.log("--- TABLES ---");
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) throw err;
    rows.forEach(row => console.log(row.name));
    console.log("--------------\n");

    // Let's guess the attendance table is named 'CHECKINOUT' or something with 'att' or 'trans'
    const likelyTables = rows.filter(r => 
      r.name.toLowerCase().includes('checkinout') || 
      r.name.toLowerCase().includes('att') || 
      r.name.toLowerCase().includes('trans') ||
      r.name.toLowerCase().includes('log')
    );

    likelyTables.forEach(table => {
      console.log(`\n--- Inspecting Table: ${table.name} ---`);
      
      // Get columns
      db.all(`PRAGMA table_info(${table.name})`, [], (err, cols) => {
        if (err) return;
        const colNames = cols.map(c => c.name).join(', ');
        console.log(`Columns: ${colNames}`);
        
        // Get 3 rows
        db.all(`SELECT * FROM ${table.name} LIMIT 3`, [], (err, data) => {
          if (err) return;
          console.log(`Sample Data:`, data);
        });
      });
    });
  });
});

// Close after 2 seconds to allow async queries to finish
setTimeout(() => db.close(), 2000);
