const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data.db');
const db = new sqlite3.Database(dbPath);

db.run("UPDATE users SET admin_level = 'super_admin' WHERE username = ?", ['admin'], function(err){
  if(err){ console.error('ERR', err.message); process.exit(1); }
  db.get("SELECT id, username, role, admin_level FROM users WHERE username = ?", ['admin'], (e,row)=>{
    if(e){ console.error('ERR', e.message); process.exit(1); }
    console.log('RESULT', JSON.stringify(row));
    db.close();
  });
});
