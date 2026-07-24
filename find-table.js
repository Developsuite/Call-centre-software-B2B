const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Program Files (x86)/ZKBio Time.Net/TimeNet.db');
db.all("SELECT name FROM sqlite_master WHERE type='table' AND sql LIKE '%punch_time%'", (err, rows) => {
  console.log(rows);
  db.close();
});
