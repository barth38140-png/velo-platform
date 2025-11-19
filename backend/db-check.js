const db = require('./src/db');

(async () => {
  try {
    const { rows } = await db.query("SELECT current_database() AS db, current_user AS user");
    console.log('db info:', rows[0]);
    const l = await db.query("SELECT id, owner_id FROM public.listings WHERE id = $1", [20001]);
    console.log('listing row:', l.rows);
    process.exit(0);
  } catch (e) {
    console.error('DB check error:', e && e.stack ? e.stack : e);
    process.exit(2);
  }
})();
