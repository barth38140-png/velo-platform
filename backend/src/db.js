const { Pool } = require('pg');
const dns = require('dns').promises;

let currentHost = process.env.PGHOST || process.env.DB_HOST || 'localhost';
let currentPort = process.env.PGPORT ? Number(process.env.PGPORT) : (process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432);

let pool = createPool(currentHost);

function createPool(host) {
  const p = new Pool({
    host,
    port: currentPort,
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.PGDATABASE || process.env.DB_NAME || (process.env.NODE_ENV === 'test' ? 'velo_platform_test' : 'velo_platform'),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    keepAlive: true,
  });

  p.on('error', (err) => {
    console.error('[src/db] pool error', err && (err.stack || err));
    // Try reinitializing pool when socket errors occur (non-blocking)
    if (err && (err.code === 'ECONNREFUSED' || (err.errors && err.errors.some(e => e.code === 'ECONNREFUSED')))) {
      reinitPool().catch((e) => console.error('[src/db] reinitPool failed:', e && (e.stack || e)));
    }
  });

  return p;
}

async function reinitPool() {
  try {
    const hostToResolve = process.env.PGHOST || process.env.DB_HOST || currentHost;
    if (!hostToResolve) return;
    // Resolve to IPv4 address to avoid ::1/127.0.0.1 fallbacks
    const records = await dns.lookup(hostToResolve, { family: 4 });
    const resolved = records && records.address ? records.address : hostToResolve;
    if (resolved && resolved !== currentHost) {
      console.log('[src/db] reinitializing pool with resolved host:', resolved);
      try {
        // Close old pool
        if (pool && typeof pool.end === 'function') {
          await pool.end();
        }
      } catch (e) {
        console.warn('[src/db] error closing old pool:', e && (e.stack || e));
      }
      currentHost = resolved;
      pool = createPool(currentHost);
    }
  } catch (err) {
    console.error('[src/db] reinitPool error:', err && (err.stack || err));
    throw err;
  }
}

if (process.env.NODE_ENV === 'test') {
  console.log('[src/db] pool config:', {
    host: process.env.PGHOST || process.env.DB_HOST || currentHost,
    port: process.env.PGPORT || process.env.DB_PORT || currentPort,
    user: process.env.PGUSER || process.env.DB_USER || 'unset',
    database: process.env.PGDATABASE || process.env.DB_NAME || 'velo_platform_test'
  });
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  reinitPool,
};


