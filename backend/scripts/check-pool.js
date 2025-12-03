// simple check to validate the shared pool can run a query
const db = require('../src/db');
(async () => {
  try {
    const { rows } = await db.query('SELECT 1 as ok');
    console.log('POOL OK', rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('POOL ERROR', err && (err.stack || err.message || err));
    process.exit(2);
  }
})();
