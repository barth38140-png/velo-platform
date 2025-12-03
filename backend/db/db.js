/* env loader */
// Load environment variables from the default `.env` file when present.
require('dotenv').config();
if (process.env.DEBUG_DB === 'true') {
   
  console.log('DB connection vars:', {
    DB_USER: process.env.DB_USER || '(unset)',
    DB_NAME: process.env.DB_NAME || '(unset)',
    DB_HOST: process.env.DB_HOST || '(unset)',
  });
}

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER,
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // max: 10, idleTimeoutMillis: 30000
});

module.exports = pool;
