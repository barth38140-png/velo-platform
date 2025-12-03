const { Pool } = require('pg');
// Load shared env from default `.env` and allow a local override file `.env.local`.
require('dotenv').config();
// Attempt to load .env.local if present — developers can create this to keep local creds
try {
  require('dotenv').config({ path: '.env.local' });
} catch {
  // ignore if not present
}

// Use PG* env vars first, then DB_* ones, then sensible defaults.
const DB_HOST = process.env.PGHOST || process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.PGPORT || process.env.DB_PORT || 5432;
const DB_USER = process.env.PGUSER || process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.PGPASSWORD || process.env.DB_PASSWORD || '';
const DB_NAME = process.env.PGDATABASE || process.env.DB_NAME || (process.env.NODE_ENV === 'test' ? 'velo_platform_test' : 'velo_platform');

// Small debug info to help diagnose local runs (safe for dev/test only)
if (process.env.DEBUG_DB === 'true') {
  const logger = require('../src/logger');
  logger.info({ host: DB_HOST, port: DB_PORT, user: DB_USER, database: DB_NAME }, '[config/db] using DB config');
}

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

module.exports = pool;
