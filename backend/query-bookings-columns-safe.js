(function(){
  require("dotenv").config();
})();
/* query-bookings-columns-safe.js */
(async ()=>{
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  try {
    const res = await pool.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('ERR', e && e.message || e);
    process.exit(2);
  } finally {
    await pool.end();
  }
})();
