const sqlite3 = require('sqlite3').verbose();
const DB_PATH = "C:\\Program Files (x86)\\ZKBio Time.Net\\TimeNet.db";

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  // First get all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) throw err;
    
    // Check tables for something like 'user', 'emp', 'staff'
    const userTables = tables.filter(t => 
      t.name.toLowerCase().includes('user') || 
      t.name.toLowerCase().includes('emp') ||
      t.name.toLowerCase().includes('person')
    );
    
    console.log("Found potential user tables:", userTables.map(t => t.name));

    userTables.forEach(table => {
      // Find 'junaid' in this table
      db.all(`PRAGMA table_info(${table.name})`, [], (err, cols) => {
        if (err) return;
        
        // Let's just select everything and filter in JS to be safe against column names
        db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
            if (err) return;
            const junaidRows = rows.filter(row => {
                return Object.values(row).some(val => 
                    String(val).toLowerCase().includes('junaid')
                );
            });
            if (junaidRows.length > 0) {
                console.log(`\nFound Junaid in table ${table.name}:`);
                console.log(junaidRows);
            }
        });
      });
    });
  });
});

setTimeout(() => db.close(), 3000);
