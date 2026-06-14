const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '..', 'data.db');
const MIGRATION = path.join(__dirname, 'migrations', 'init.sql');

const db = new sqlite3.Database(DB_PATH);

const init = () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8');
  // Split SQL into individual statements and run them sequentially so we can
  // ignore ALTER errors like duplicate columns (safe for idempotent migrations).
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean)

  db.serialize(() => {
    statements.forEach((stmt) => {
      // Ensure each statement ends with a semicolon for sqlite
      const toRun = stmt.trim().endsWith(';') ? stmt : stmt + ';'
      db.run(toRun, (err) => {
        if (err) {
          // Ignore duplicate column errors (happens when re-running migrations)
          if (err.message && err.message.toLowerCase().includes('duplicate column name')) {
            console.warn('Skipping migration (duplicate column):', err.message)
            return
          }
          // Log other migration errors but continue
          console.error('Migration statement failed:', err.message)
        }
      })
    })
  })
};

module.exports = { db, init };
