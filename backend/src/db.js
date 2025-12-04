const { Pool } = require('pg');
const dns = require('dns').promises;
const logger = require('./logger');

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
    logger.error({ err }, '[src/db] pool error');
    // Try reinitializing pool when socket errors occur (non-blocking)
    if (err && (err.code === 'ECONNREFUSED' || (err.errors && err.errors.some(e => e.code === 'ECONNREFUSED')))) {
      reinitPool().catch((e) => logger.error({ err: e }, '[src/db] reinitPool failed'));
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
      logger.info({ host: resolved }, '[src/db] reinitializing pool with resolved host');
      try {
        // Close old pool
        if (pool && typeof pool.end === 'function') {
          await pool.end();
        }
      } catch (e) {
        logger.warn({ err: e }, '[src/db] error closing old pool');
      }
      currentHost = resolved;
      pool = createPool(currentHost);
    }
  } catch (err) {
    logger.error({ err }, '[src/db] reinitPool error');
    throw err;
  }
}

if (process.env.NODE_ENV === 'test') {
  logger.info('[src/db] pool config:', {
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


