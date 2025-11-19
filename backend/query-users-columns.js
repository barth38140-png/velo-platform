(function(){
  require("dotenv").config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });
})();
/* query-users-columns.js */
(async ()=>{
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  try {
    const res = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    if (res.rows.length === 0) {
      console.log('NO_USERS_TABLE');
      process.exit(0);
    }
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('ERR', e && e.message || e);
    process.exit(2);
  } finally {
    await pool.end();
  }
})();
