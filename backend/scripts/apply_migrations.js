const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function applyMigration(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log('Applying migration:', path.basename(filePath));
  await pool.query(sql);
  console.log('Applied', path.basename(filePath));
}

async function main() {
  try {
    const migrationsDir = path.resolve(__dirname, '..', 'sql');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const f of files) {
      await applyMigration(path.join(migrationsDir, f));
    }
    console.log('All migrations applied');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err && (err.stack || err.message || err));
    process.exit(1);
  }
}

if (require.main === module) main();
