const pool = require('./config/db');

pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
  .then(r => {
    console.log('Tables existantes:', r.rows.map(x => x.table_name).join(', '));
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
