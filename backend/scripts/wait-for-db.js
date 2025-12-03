#!/usr/bin/env node
// Charger les variables d'environnement selon NODE_ENV
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: '.env.test' });
} else {
  require('dotenv').config();
}

const { Client } = require('pg');

const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
const port = Number(process.env.DB_PORT || process.env.PGPORT || 5432);
const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || process.env.PGDATABASE || 'velo_platform_test';
const retries = Number(process.env.WAIT_DB_RETRIES || 30);
const delayMs = Number(process.env.WAIT_DB_DELAY_MS || 1000);

async function wait() {
  for (let i = 0; i < retries; i++) {
    const client = new Client({ host, port, user, password, database });
    try {
      await client.connect();
      await client.end();
      console.log('[wait-for-db] DB is available');
      return 0;
    } catch (err) {
      const remain = retries - i - 1;
      console.log(`[wait-for-db] attempt ${i + 1} failed: ${err.message}. retries left: ${remain}`);
      if (i === retries - 1) {
        console.error('[wait-for-db] DB did not become available in time');
        return 1;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return 1;
}

wait().then((code) => process.exit(code));
