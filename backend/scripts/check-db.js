// quick DB check script — loads .env.test when NODE_ENV=test
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
const fs = require('fs');
const path = require('path');

// Manually load .env.test to avoid any dotenv wrapper issues
function loadEnvFile(envPath) {
  try {
    const raw = fs.readFileSync(envPath, { encoding: 'utf8' });
    raw.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      // remove optional surrounding quotes
      const cleaned = val.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      process.env[key] = cleaned;
    });
    return true;
  } catch (err) {
    console.error('Failed to read env file', envPath, err.message);
    return false;
  }
}

const envFile = path.resolve(__dirname, '..', '.env.test');
console.log('Attempting to load env file:', envFile);
loadEnvFile(envFile);
console.log('Loaded env (NODE_ENV):', process.env.NODE_ENV);
console.log('process.env.DB_PASSWORD present?', typeof process.env.DB_PASSWORD !== 'undefined');
console.log('process.env.PGPASSWORD present?', typeof process.env.PGPASSWORD !== 'undefined');

const pool = require('../config/db');

async function check() {
  try {
    const res = await pool.query('SELECT current_database() as db, current_user as user, now() as now');
    console.log('DB check success:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('DB check error:', err.message || err);
    if (err.code) console.error('Postgres error code:', err.code);
    process.exit(1);
  }
}

check();
