const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'postgres',
  password_hash: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'velo_platform',
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};


